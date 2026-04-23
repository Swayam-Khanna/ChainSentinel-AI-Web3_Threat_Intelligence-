# 🛡️ ChainSentinel: Production-Grade Web3 Exploit Detection

ChainSentinel is a full-stack, real-time Ethereum mempool monitoring and threat intelligence platform. Built for scalability and reliability.

## 🏗️ Architecture
- **Frontend**: React + TypeScript + Tailwind v4 + Framer Motion.
- **Backend**: Node.js + Express + WebSocket Server.
- **Persistence**: MongoDB (Mongoose) for historical alerts.
- **Engine**: Dual-layer detection (Heuristics + Streaming Isolation Forest).

## 🚀 Quick Start (Local)
1.  **Database**: Start MongoDB locally or use a MongoDB Atlas URI in `.env`.
2.  **Backend**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
3.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 🌍 Deployment
### Backend (Railway / Render / Heroku)
- Set `MONGODB_URI` and `ETH_WS_URL` in environment variables.
- Ensure the port is correctly mapped.

### Frontend (Vercel / Netlify)
- Set `VITE_API_URL` and `VITE_WS_URL` to point to your deployed backend.
- Build command: `npm run build`.

## 🧪 Simulation Suite
Use the **Security Simulation** panel in the dashboard to trigger:
- **Sandwich Attack**: MEV bot simulation.
- **Gas Spike**: Sudden 10x gas increase detection.
- **Contract Burst**: Rapid reentrancy-style attack patterns.

---
*Production system built for high-throughput blockchain analysis.*
