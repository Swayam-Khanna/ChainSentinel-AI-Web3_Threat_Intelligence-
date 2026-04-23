// ─── In-Memory Data Store ─────────────────────────────────────────────────────
// Circular buffer: keeps last N items for performance

const MAX_TRANSACTIONS = 500;
const MAX_ALERTS = 100;

let transactions = [];
let alerts = [];
let stats = {
  totalTx: 0,
  totalAlerts: 0,
  criticalAlerts: 0,
  highAlerts: 0,
  mediumAlerts: 0,
  lowAlerts: 0,
  avgGasPrice: 0,
  avgRiskScore: 0,
  txPerMinute: 0,
  contractHits: {},        // { address: count }
  recentRiskScores: [],    // last 20 risk scores for chart
  startTime: Date.now(),
};

let txTimestamps = []; // for tx/min calculation

// ─── Transactions ─────────────────────────────────────────────────────────────
function addTransaction(tx) {
  transactions.unshift(tx); // newest first
  if (transactions.length > MAX_TRANSACTIONS) transactions.pop();

  // Update stats
  stats.totalTx++;
  txTimestamps.push(Date.now());

  // Trim timestamps older than 60s
  const oneMinAgo = Date.now() - 60000;
  txTimestamps = txTimestamps.filter((t) => t > oneMinAgo);
  stats.txPerMinute = txTimestamps.length;

  // Gas price average (in Gwei)
  if (tx.gasPrice) {
    try {
      const gpGwei = Number(BigInt(tx.gasPrice)) / 1e9;
      stats.avgGasPrice = stats.avgGasPrice
        ? (stats.avgGasPrice * 0.95 + gpGwei * 0.05) // EMA
        : gpGwei;
    } catch (e) {
      // Ignore invalid gas prices
    }
  }

  // Contract hit frequency
  if (tx.to) {
    stats.contractHits[tx.to] = (stats.contractHits[tx.to] || 0) + 1;
  }
}

function getTransactions(limit = 50) {
  return transactions.slice(0, limit);
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
function addAlert(alert) {
  alerts.unshift(alert);
  if (alerts.length > MAX_ALERTS) alerts.pop();

  // Update alert stats
  stats.totalAlerts++;
  const sev = alert.severity?.toLowerCase();
  if (sev === 'critical') stats.criticalAlerts++;
  else if (sev === 'high') stats.highAlerts++;
  else if (sev === 'medium') stats.mediumAlerts++;
  else if (sev === 'low') stats.lowAlerts++;

  // Track risk score trend
  stats.recentRiskScores.push(alert.riskScore);
  if (stats.recentRiskScores.length > 20) stats.recentRiskScores.shift();

  // Avg risk score (of anomalous txs)
  const sum = stats.recentRiskScores.reduce((a, b) => a + b, 0);
  stats.avgRiskScore = stats.recentRiskScores.length > 0 
    ? Math.round(sum / stats.recentRiskScores.length)
    : 0;
}

function getAlerts(limit = 20) {
  return alerts.slice(0, limit);
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function getStats() {
  const uptimeMs = Date.now() - stats.startTime;
  const topContracts = Object.entries(stats.contractHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([address, count]) => ({ address, count }));

  return {
    ...stats,
    topContracts,
    uptimeMs,
    contractHits: undefined, // don't expose raw map (too large)
  };
}

module.exports = { addTransaction, getTransactions, addAlert, getAlerts, getStats };
