/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ChainSentinel — Anomaly Detection Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TWO-LAYER DETECTION:
 *  Layer 1: Rule-Based (fast, deterministic, instant alerts)
 *  Layer 2: Statistical ML (Isolation Forest–style scoring via z-score + IQR)
 *
 * Each detected anomaly returns:
 *  { riskScore: 0-100, severity, reason, type }
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { IsolationForestScorer } = require('./isolationForest');

// Sliding window: last N transactions for pattern analysis
const WINDOW_SIZE = 100;

// Gas price baseline tracker (exponential moving average)
let gasPriceEMA = null;
const GAS_ALPHA = 0.1; // smoothing factor

// Per-contract burst tracker: { address -> [timestamps] }
const contractBurstMap = new Map();
const BURST_WINDOW_MS = parseInt(process.env.BURST_WINDOW_MS) || 10000;
const BURST_THRESHOLD = parseInt(process.env.BURST_TX_THRESHOLD) || 5;

// Isolation Forest instance (stateful, updates with each tx)
const isoForest = new IsolationForestScorer();

/**
 * Main entry point. Called for every new transaction.
 * Returns anomaly object if detected, or null.
 */
function analyzeTransaction(tx, recentTxs) {
  const features = extractFeatures(tx, recentTxs);
  isoForest.addSample(features);

  // Run all detection layers
  const detections = [
    detectGasSpike(tx, features),
    detectContractBurst(tx),
    detectSandwichPattern(tx, recentTxs),
    detectLargeValueTransfer(tx, features),
    detectContractCreation(tx),
    detectIsolationForestAnomaly(features),
  ].filter(Boolean);

  if (detections.length === 0) return null;

  // Aggregate: take highest risk score, merge reasons
  const topDetection = detections.reduce((a, b) => (a.riskScore >= b.riskScore ? a : b));
  const allReasons = [...new Set(detections.map((d) => d.reason))].join(' | ');

  return {
    ...topDetection,
    reason: allReasons,
    riskScore: Math.min(100, detections.reduce((sum, d) => sum + d.riskScore, 0)),
    severity: scoreToSeverity(Math.min(100, detections.reduce((sum, d) => sum + d.riskScore, 0))),
  };
}

// ─── Feature Extraction ───────────────────────────────────────────────────────
function extractFeatures(tx, recentTxs) {
  const gpWei = safeParseInt(tx.gasPrice);
  const gpGwei = gpWei / 1e9;
  const valueEth = safeParseInt(tx.value) / 1e18;
  const gasLimit = safeParseInt(tx.gasLimit);
  const isContract = tx.data && tx.data !== '0x' && tx.data.length > 2;
  const dataLen = tx.data ? tx.data.length : 0;

  // Update gas EMA
  if (gpGwei > 0) {
    gasPriceEMA = gasPriceEMA === null ? gpGwei : gasPriceEMA * (1 - GAS_ALPHA) + gpGwei * GAS_ALPHA;
  }

  // Count recent txs to same contract
  const sameContractCount = tx.to
    ? recentTxs.filter((t) => t.to === tx.to).slice(0, WINDOW_SIZE).length
    : 0;

  const gasSpikeRatio = gasPriceEMA && gpGwei > 0 ? gpGwei / gasPriceEMA : 1;

  return {
    gpGwei,
    valueEth,
    gasLimit,
    isContract: isContract ? 1 : 0,
    dataLen,
    sameContractCount,
    gasSpikeRatio,
  };
}

// ─── LAYER 1: Rule-Based Detectors ───────────────────────────────────────────

/** Detects abnormally high gas prices (>3x EMA baseline) */
function detectGasSpike(tx, features) {
  const multiplier = parseFloat(process.env.GAS_SPIKE_MULTIPLIER) || 3;
  if (features.gasSpikeRatio > multiplier) {
    const score = Math.min(70, Math.round((features.gasSpikeRatio - multiplier) * 15) + 30);
    return {
      type: 'GAS_SPIKE',
      riskScore: score,
      severity: scoreToSeverity(score),
      reason: `Gas price spike: ${features.gpGwei.toFixed(1)} Gwei (${features.gasSpikeRatio.toFixed(1)}x baseline)`,
    };
  }
  return null;
}

/** Detects burst of txs to same contract within time window */
function detectContractBurst(tx) {
  if (!tx.to) return null;

  const now = Date.now();
  const addr = tx.to.toLowerCase();

  if (!contractBurstMap.has(addr)) contractBurstMap.set(addr, []);
  const timestamps = contractBurstMap.get(addr);
  timestamps.push(now);

  // Prune old timestamps outside window
  const windowStart = now - BURST_WINDOW_MS;
  const recent = timestamps.filter((t) => t >= windowStart);
  contractBurstMap.set(addr, recent);

  if (recent.length >= BURST_THRESHOLD) {
    const rate = recent.length;
    const score = Math.min(90, 40 + rate * 5);
    return {
      type: 'CONTRACT_BURST',
      riskScore: score,
      severity: scoreToSeverity(score),
      reason: `Contract burst: ${rate} txs to ${shortAddr(tx.to)} in ${BURST_WINDOW_MS / 1000}s — possible reentrancy/flash attack`,
    };
  }
  return null;
}

/** Detects sandwich attack pattern: same sender, same target contract, buy→??→sell in rapid succession */
function detectSandwichPattern(tx, recentTxs) {
  if (!tx.to || !tx.from) return null;

  const windowTxs = recentTxs.slice(0, 20);
  const sameFrom = windowTxs.filter(
    (t) => t.from?.toLowerCase() === tx.from?.toLowerCase() && t.id !== tx.id
  );

  if (sameFrom.length >= 2) {
    const score = 65;
    return {
      type: 'SANDWICH_ATTACK',
      riskScore: score,
      severity: scoreToSeverity(score),
      reason: `Sandwich pattern: wallet ${shortAddr(tx.from)} sent ${sameFrom.length + 1} txs rapidly — potential MEV sandwich attack`,
    };
  }
  return null;
}

/** Detects unusually large ETH transfers */
function detectLargeValueTransfer(tx, features) {
  const LARGE_ETH = 50; // ETH threshold
  if (features.valueEth > LARGE_ETH) {
    const score = Math.min(80, 40 + Math.round(features.valueEth / 10));
    return {
      type: 'LARGE_TRANSFER',
      riskScore: score,
      severity: scoreToSeverity(score),
      reason: `Large value transfer: ${features.valueEth.toFixed(2)} ETH — whale movement detected`,
    };
  }
  return null;
}

/** Detects contract deployment (no 'to' address, has data) */
function detectContractCreation(tx) {
  if (!tx.to && tx.data && tx.data.length > 10) {
    return {
      type: 'CONTRACT_CREATION',
      riskScore: 35,
      severity: 'medium',
      reason: `New contract deployment from ${shortAddr(tx.from)} — monitor for rug pull or exploit contract`,
    };
  }
  return null;
}

// ─── LAYER 2: Statistical / ML Detection ─────────────────────────────────────

/** Uses Isolation Forest scorer for multivariate anomaly detection */
function detectIsolationForestAnomaly(features) {
  const anomalyScore = isoForest.score(features);
  if (anomalyScore > 0.72) { // threshold: 0=normal, 1=anomaly
    const riskScore = Math.round(anomalyScore * 60);
    return {
      type: 'ML_ANOMALY',
      riskScore,
      severity: scoreToSeverity(riskScore),
      reason: `ML anomaly detected: multivariate outlier (score: ${anomalyScore.toFixed(3)}) — unusual tx pattern`,
    };
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreToSeverity(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function safeParseInt(val) {
  try {
    return parseInt(BigInt(val || '0').toString());
  } catch {
    return 0;
  }
}

function shortAddr(addr) {
  if (!addr) return 'unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

module.exports = { analyzeTransaction };
