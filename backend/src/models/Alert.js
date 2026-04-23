const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  txHash: { type: String, required: true, index: true },
  contract: { type: String, index: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  riskScore: { type: Number, required: true },
  reason: { type: String, required: true },
  type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  defended: { type: Boolean, default: false },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
