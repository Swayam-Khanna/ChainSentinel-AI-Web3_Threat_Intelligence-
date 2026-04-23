const { ethers } = require('ethers');

/**
 * Connects to Ethereum via WebSocket and streams pending transactions.
 * Only active when SIMULATION_MODE=false.
 */
async function startMempoolListener(onTransaction) {
  const wsUrl = process.env.ETH_WS_URL;
  if (!wsUrl || wsUrl.includes('YOUR_ALCHEMY_KEY')) {
    console.warn('[MEMPOOL] No valid WS URL. Set ETH_WS_URL in .env to enable live mode.');
    return;
  }

  console.log('[MEMPOOL] Connecting to Ethereum WebSocket...');

  let provider;
  try {
    provider = new ethers.WebSocketProvider(wsUrl);
  } catch (err) {
    console.error('[MEMPOOL] Failed to create provider:', err.message);
    return;
  }

  provider.on('error', (err) => {
    console.error('[MEMPOOL] Provider error:', err.message);
  });

  // Listen for pending tx hashes
  provider.on('pending', async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) return;

      // Extract structured features
      const structured = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value?.toString() || '0',
        gasPrice: tx.gasPrice?.toString() || '0',
        gasLimit: tx.gasLimit?.toString() || '21000',
        data: tx.data || '0x',
        blockNumber: tx.blockNumber,
      };

      onTransaction(structured);
    } catch (err) {
      // Silently drop individual tx fetch errors (network congestion)
    }
  });

  console.log('[MEMPOOL] ✅ Listening for pending transactions on Ethereum mainnet...');
}

module.exports = { startMempoolListener };
