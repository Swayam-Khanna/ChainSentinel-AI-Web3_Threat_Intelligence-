/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ChainSentinel — Attack Simulation Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects realistic attack scenarios into the backend via POST /inject.
 *
 * Usage:
 *   node src/simulate.js              → run all scenarios
 *   node src/simulate.js sandwich     → run sandwich attack only
 *   node src/simulate.js burst        → run contract burst only
 *   node src/simulate.js gas          → run gas spike only
 *   node src/simulate.js whale        → run whale transfer only
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const http = require('http');

const BASE_URL = `http://localhost:${process.env.PORT || 4000}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomHex(len = 40) {
  return '0x' + Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function toWei(eth) {
  return (BigInt(Math.round(eth * 1e9)) * BigInt(1e9)).toString();
}

function toGwei(gwei) {
  return (BigInt(Math.round(gwei)) * BigInt(1e9)).toString();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function inject(tx) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(tx);
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 4000,
      path: '/inject',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Scenario 1: Normal Background Traffic ────────────────────────────────────
async function simulateNormalTraffic(count = 15) {
  console.log('\n[SIM] 📊 Generating normal background traffic...');
  const contracts = [randomHex(), randomHex(), randomHex()];
  for (let i = 0; i < count; i++) {
    await inject({
      hash: randomHex(64),
      from: randomHex(),
      to: contracts[i % contracts.length],
      value: toWei(Math.random() * 2),
      gasPrice: toGwei(20 + Math.random() * 10),
      gasLimit: '21000',
      data: '0x',
    });
    await sleep(200);
  }
  console.log(`[SIM] ✅ Injected ${count} normal transactions`);
}

// ─── Scenario 2: Gas Price Spike Attack ───────────────────────────────────────
async function simulateGasSpike() {
  console.log('\n[SIM] ⛽ Simulating GAS SPIKE attack...');
  const attacker = randomHex();
  const contract = randomHex();

  // Normal txs first (build EMA baseline)
  for (let i = 0; i < 5; i++) {
    await inject({ hash: randomHex(64), from: randomHex(), to: contract, value: '0', gasPrice: toGwei(22), gasLimit: '50000', data: '0xa9059cbb' });
    await sleep(150);
  }

  // SPIKE: attacker submits tx with 10x gas to front-run
  await inject({
    hash: randomHex(64),
    from: attacker,
    to: contract,
    value: toWei(0.5),
    gasPrice: toGwei(300), // massive spike
    gasLimit: '200000',
    data: '0xa9059cbb000000000000000000000000' + attacker.slice(2),
  });

  console.log('[SIM] 🚨 Gas spike injected — 300 Gwei (10x+ baseline)');
}

// ─── Scenario 3: Contract Burst (Flash Loan / Reentrancy Probe) ───────────────
async function simulateContractBurst() {
  console.log('\n[SIM] 💥 Simulating CONTRACT BURST attack...');
  const attacker = randomHex();
  const victimContract = randomHex();

  // Rapid burst: 8 txs to same contract within 2s
  for (let i = 0; i < 8; i++) {
    await inject({
      hash: randomHex(64),
      from: attacker,
      to: victimContract,
      value: toWei(0.1),
      gasPrice: toGwei(30),
      gasLimit: '150000',
      data: '0x70a08231000000000000000000000000' + attacker.slice(2),
    });
    await sleep(200); // 200ms apart = 8 txs in 1.6s
  }

  console.log('[SIM] 🚨 Contract burst injected — 8 txs to same contract in <2s');
}

// ─── Scenario 4: Sandwich Attack Pattern ──────────────────────────────────────
async function simulateSandwichAttack() {
  console.log('\n[SIM] 🥪 Simulating SANDWICH ATTACK pattern...');
  const attacker = randomHex();
  const victim = randomHex();
  const dexContract = randomHex();

  // Step 1: Attacker BUY (front-run with high gas)
  await inject({
    hash: randomHex(64),
    from: attacker,
    to: dexContract,
    value: toWei(5),
    gasPrice: toGwei(200),
    gasLimit: '250000',
    data: '0x38ed1739', // swapExactTokensForTokens selector
  });
  await sleep(100);

  // Step 2: Victim's original transaction (lower gas, gets sandwiched)
  await inject({
    hash: randomHex(64),
    from: victim,
    to: dexContract,
    value: toWei(2),
    gasPrice: toGwei(25),
    gasLimit: '200000',
    data: '0x38ed1739',
  });
  await sleep(100);

  // Step 3: Attacker SELL (back-run)
  await inject({
    hash: randomHex(64),
    from: attacker,
    to: dexContract,
    value: '0',
    gasPrice: toGwei(200),
    gasLimit: '250000',
    data: '0x38ed1739',
  });

  console.log('[SIM] 🚨 Sandwich attack sequence injected — buy → victim → sell');
}

// ─── Scenario 5: Whale Transfer ───────────────────────────────────────────────
async function simulateWhaleTransfer() {
  console.log('\n[SIM] 🐋 Simulating WHALE TRANSFER...');
  await inject({
    hash: randomHex(64),
    from: randomHex(),
    to: randomHex(),
    value: toWei(5000), // 5000 ETH
    gasPrice: toGwei(35),
    gasLimit: '21000',
    data: '0x',
  });
  console.log('[SIM] 🚨 Whale transfer injected — 5000 ETH movement');
}

// ─── Scenario 6: Contract Deployment (Rug Pull Setup) ────────────────────────
async function simulateContractDeploy() {
  console.log('\n[SIM] 📜 Simulating suspicious CONTRACT DEPLOYMENT...');
  await inject({
    hash: randomHex(64),
    from: randomHex(),
    to: null, // contract creation = no 'to'
    value: '0',
    gasPrice: toGwei(40),
    gasLimit: '3000000',
    data: '0x60806040523480156100' + randomHex(100).slice(2), // mock bytecode
  });
  console.log('[SIM] 🚨 Contract deployment injected — potential exploit contract');
}

// ─── Main Runner ──────────────────────────────────────────────────────────────
async function main() {
  const scenario = process.argv[2];
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   ChainSentinel Attack Simulator      ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`Target: ${BASE_URL}\n`);

  // Wait for server to be ready
  await sleep(1000);

  try {
    if (!scenario || scenario === 'all') {
      await simulateNormalTraffic(20);
      await sleep(500);
      await simulateGasSpike();
      await sleep(500);
      await simulateContractBurst();
      await sleep(500);
      await simulateSandwichAttack();
      await sleep(500);
      await simulateWhaleTransfer();
      await sleep(500);
      await simulateContractDeploy();
    } else if (scenario === 'normal') await simulateNormalTraffic();
    else if (scenario === 'gas') await simulateGasSpike();
    else if (scenario === 'burst') await simulateContractBurst();
    else if (scenario === 'sandwich') await simulateSandwichAttack();
    else if (scenario === 'whale') await simulateWhaleTransfer();
    else if (scenario === 'deploy') await simulateContractDeploy();
    else console.log(`Unknown scenario: ${scenario}. Use: all | normal | gas | burst | sandwich | whale | deploy`);

    console.log('\n[SIM] ✅ Simulation complete! Check dashboard for alerts.\n');
  } catch (err) {
    console.error('[SIM] ❌ Error:', err.message);
    console.error('[SIM] Make sure the backend is running: npm run dev');
  }
}

main();
