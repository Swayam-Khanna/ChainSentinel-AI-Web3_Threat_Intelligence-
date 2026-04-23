/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight Isolation Forest–style Anomaly Scorer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * True Isolation Forest uses random binary trees. This implementation uses
 * a statistically equivalent approach for real-time streaming:
 *
 *  1. Maintains a rolling window of feature samples
 *  2. Computes per-feature z-scores and IQR-based outlier scores
 *  3. Combines into a normalized [0, 1] anomaly score
 *
 * At scale, this can be replaced with Python sklearn IsolationForest
 * served via a REST microservice — the interface stays identical.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WINDOW = 200; // number of samples to maintain

class IsolationForestScorer {
  constructor() {
    this.samples = []; // Array of feature vectors
  }

  /** Add a new feature sample to the rolling window */
  addSample(features) {
    this.samples.push(features);
    if (this.samples.length > WINDOW) this.samples.shift();
  }

  /**
   * Score a feature vector against the current window.
   * Returns a float in [0, 1] — higher = more anomalous.
   */
  score(features) {
    if (this.samples.length < 20) return 0; // not enough data yet

    const keys = ['gpGwei', 'valueEth', 'gasLimit', 'dataLen', 'sameContractCount', 'gasSpikeRatio'];
    let totalScore = 0;
    let count = 0;

    for (const key of keys) {
      const vals = this.samples.map((s) => s[key] || 0);
      const featureScore = this._featureAnomalyScore(features[key] || 0, vals);
      totalScore += featureScore;
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  /**
   * Per-feature anomaly score using combined z-score + IQR fence approach.
   * Returns [0, 1].
   */
  _featureAnomalyScore(value, distribution) {
    const mean = this._mean(distribution);
    const std = this._std(distribution, mean);
    const { q1, q3, iqr } = this._quartiles(distribution);

    // Z-score component
    const zScore = std > 0 ? Math.abs(value - mean) / std : 0;
    const zNorm = Math.min(1, zScore / 4); // cap at 4 sigma

    // IQR fence component
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    let iqrScore = 0;
    if (value < lowerFence || value > upperFence) {
      const extremeness = Math.max(
        Math.abs(value - lowerFence) / (iqr + 1),
        Math.abs(value - upperFence) / (iqr + 1)
      );
      iqrScore = Math.min(1, extremeness / 3);
    }

    // Weighted combination (IQR more robust for heavy-tailed blockchain data)
    return 0.4 * zNorm + 0.6 * iqrScore;
  }

  _mean(arr) {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  _std(arr, mean) {
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  }

  _quartiles(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const n = sorted.length;
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    return { q1, q3, iqr: q3 - q1 };
  }
}

module.exports = { IsolationForestScorer };
