const isolationForest = require('./isolationForest');

class AnomalyService {
  constructor() {
    this.contractHits = new Map();
    this.windowSize = 10000; // 10s window
  }

  async analyze(tx, currentStats) {
    try {
      const alerts = [];
      const features = this.extractFeatures(tx, currentStats);
      
      // 1. Deterministic Heuristics
      const gasAlert = this.checkGasSpike(features.gpGwei, currentStats.avgGasPrice);
      if (gasAlert) alerts.push(gasAlert);

      const burstAlert = this.checkContractBurst(tx.to);
      if (burstAlert) alerts.push(burstAlert);

      // 2. Machine Learning Scorer
      const mlScore = isolationForest.score(features, currentStats);
      
      // Combine and return
      const combinedScore = this.calculateCombinedScore(alerts, mlScore);
      
      if (combinedScore > 50 || alerts.length > 0) {
        return {
          txHash: tx.hash,
          contract: tx.to,
          riskScore: combinedScore,
          severity: this.getSeverity(combinedScore),
          reason: alerts.map(a => a.reason).join(' | ') || 'Anomalous behavior detected by ML engine',
          type: alerts[0]?.type || 'ML_ANOMALY',
          metadata: { mlScore, gasPrice: features.gasPrice }
        };
      }
    } catch (err) {
      console.error('[AnomalyService] Analysis failed for tx:', tx.hash, err.message);
    }
    
    return null;
  }

  extractFeatures(tx, currentStats) {
    const gpGwei = tx.gasPrice ? Number(BigInt(tx.gasPrice)) / 1e9 : 0;
    const features = {
      gpGwei,
      valueEth: tx.value ? Number(ethers.formatEther(tx.value)) : 0,
      gasLimit: tx.gasLimit ? Number(tx.gasLimit) : 21000,
      dataLen: tx.data ? tx.data.length : 0,
      sameContractCount: tx.to ? (currentStats.contractHits?.[tx.to] || 0) : 0,
      gasSpikeRatio: currentStats.avgGasPrice > 0 ? gpGwei / currentStats.avgGasPrice : 1
    };
    
    // Feed the ML engine
    isolationForest.addSample(features);
    
    return features;
  }

  checkGasSpike(gasPrice, avgGasPrice) {
    if (avgGasPrice > 0 && gasPrice > avgGasPrice * 5) {
      return { reason: `Gas spike detected: ${gasPrice.toFixed(1)} Gwei`, type: 'GAS_SPIKE' };
    }
    return null;
  }

  checkContractBurst(target) {
    if (!target) return null;
    const now = Date.now();
    const hits = this.contractHits.get(target) || [];
    const recentHits = hits.filter(h => now - h < this.windowSize);
    recentHits.push(now);
    this.contractHits.set(target, recentHits);

    if (recentHits.length > 5) {
      return { reason: `Rapid burst to contract: ${recentHits.length} txs/10s`, type: 'CONTRACT_BURST' };
    }
    return null;
  }

  calculateCombinedScore(alerts, mlScore) {
    let score = mlScore * 100;
    if (alerts.some(a => a.type === 'GAS_SPIKE')) score += 30;
    if (alerts.some(a => a.type === 'CONTRACT_BURST')) score += 40;
    return Math.min(100, Math.round(score));
  }

  getSeverity(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  }
}

const { ethers } = require('ethers');
module.exports = new AnomalyService();
