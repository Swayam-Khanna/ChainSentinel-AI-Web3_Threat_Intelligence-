const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();

const blockchainService = require('./services/BlockchainService');
const anomalyService = require('./services/AnomalyService');
const dataStore = require('./store/dataStore');
const Alert = require('./models/Alert');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// ─── Database Connection ────────────────────────────────────────────────────
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.warn('⚠️ No MONGODB_URI found. Running in ephemeral mode (no persistence).');
}

// ─── WebSocket Broadcasting ──────────────────────────────────────────────────
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ─── Core Event Loop ────────────────────────────────────────────────────────
async function handleNewTransaction(tx) {
  // 1. Log & Store
  dataStore.addTransaction(tx);
  broadcast('NEW_TX', tx);

  // 2. Analyze
  const stats = dataStore.getStats();
  const alertData = await anomalyService.analyze(tx, stats);

  // 3. Alert if suspicious
  if (alertData) {
    const alert = { ...alertData, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    
    // Save to DB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const dbAlert = new Alert(alertData);
        await dbAlert.save();
      } catch (err) {
        console.error('Failed to save alert to DB:', err);
      }
    }

    dataStore.addAlert(alert);
    broadcast('NEW_ALERT', alert);
    broadcast('STATS_UPDATE', dataStore.getStats());
  }
}

// ─── API Routes ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/stats', (req, res) => res.json(dataStore.getStats()));
app.get('/alerts', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
    return res.json(alerts);
  }
  res.json(dataStore.getAlerts());
});

app.post('/inject', (req, res) => {
  handleNewTransaction(req.body);
  res.json({ success: true });
});

app.post('/defend', async (req, res) => {
  const { alertId } = req.body;
  if (mongoose.connection.readyState === 1) {
    await Alert.findOneAndUpdate({ _id: alertId }, { defended: true });
  }
  console.log(`[🛡️ DEFENSE] Mitigating alert ${alertId}`);
  res.json({ success: true });
});

// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🛡️ ChainSentinel Production Server running on port ${PORT}`);
  blockchainService.connect(handleNewTransaction);
});

// ─── WebSocket Client Sync ──────────────────────────────────────────────────
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'INIT',
    payload: {
      transactions: dataStore.getTransactions(),
      alerts: dataStore.getAlerts(),
      stats: dataStore.getStats()
    }
  }));
});
