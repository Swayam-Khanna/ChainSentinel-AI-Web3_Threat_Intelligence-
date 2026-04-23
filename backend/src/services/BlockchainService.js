const { ethers } = require('ethers');
require('dotenv').config();

class BlockchainService {
  constructor() {
    this.provider = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isSimulation = process.env.SIMULATION_MODE === 'true';
  }

  async connect(onTransaction) {
    if (this.isSimulation) {
      console.log('[ChainService] RUNNING IN SIMULATION MODE');
      return;
    }

    const wsUrl = process.env.ETH_WS_URL;
    if (!wsUrl) {
      console.warn('[ChainService] No ETH_WS_URL found. Defaulting to simulation.');
      this.isSimulation = true;
      return;
    }

    try {
      this.provider = new ethers.WebSocketProvider(wsUrl);
      
      this.provider.on('pending', async (txHash) => {
        try {
          const tx = await this.provider.getTransaction(txHash);
          if (tx) onTransaction(tx);
        } catch (err) {
          // Silent fail for individual tx fetch errors (common in mempool)
        }
      });

      this.provider.websocket.on('close', () => {
        console.error('[ChainService] WebSocket closed. Attempting reconnect...');
        this.handleReconnect(onTransaction);
      });

      console.log('[ChainService] Connected to Ethereum Mempool');
    } catch (err) {
      console.error('[ChainService] Connection failed:', err.message);
      this.handleReconnect(onTransaction);
    }
  }

  handleReconnect(onTransaction) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => this.connect(onTransaction), delay);
    } else {
      console.error('[ChainService] Max reconnect attempts reached. Switching to simulation.');
      this.isSimulation = true;
    }
  }
}

module.exports = new BlockchainService();
