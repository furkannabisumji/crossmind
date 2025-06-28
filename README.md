# 🧠 CrossMind – Autonomous Web3 Investment Agent

CrossMind is an AI-powered autonomous DeFi agent that dynamically manages user funds across multiple chains and protocols to maximize returns. It leverages Chainlink infrastructure for security, automation, and interoperability.

---

## 📁 Project Structure

+--------------------------------------------------------------------------------------------------------------+
| CROSSMIND TECHNICAL FLOW DIAGRAM |
+--------------------------------------------------------------------------------------------------------------+

+-------------------+ +-------------------+ +-------------------+ +-------------------+
| | | | | | | |
| USER INTERFACE | | ZOYA AI ADVISOR | | BLOCKCHAIN LAYER | | EXTERNAL PROTOCOLS|
| (Next.js App) | | (ElizaOS/AWS | | (Smart Contracts)| | |
| | | Bedrock) | | | | |
+--------+----------+ +---------+---------+ +--------+----------+ +---------+---------+
| | | |
| | | |
v v v v
+--------+----------+ +---------+---------+ +--------+----------+ +---------+---------+
| | | | | | | |
| - Wallet Connect +<----->+ - Socket.io Conn | | Ethereum Sepolia | | - Aave Protocol |
| - USDC Deposit | | - NLP Processing | | +--------------+ | | - QuickSwap |
| - Risk Selection | | - Strategy Gen | | |CrossMindVault| | | - Other DeFi |
| - Strategy Display| | - API Endpoints | | +--------------+ | | Protocols |
| | | | | |StrategyManager| | | |
+-------------------+ +-------------------+ | +--------------+ | +-------------------+
| | | |CrossChainExec | | |
| | | +--------------+ | |
+----------------------------+ | |AdapterRegistry| | |
| | +--------------+ | |
| +--------+----------+ |
| | |
| v |
| +--------+----------+ |
| | | |
| | Avalanche Fuji | |
| | +-------------+ | |
| | |Receiver | | |
| | +-------------+ | |
| | |Protocol | | |
| | |Adapters +---+-----------------+
| | +-------------+ |
| | |
| +-------------------+
|
|
+-------------------v-------------------------------------------+
| |
| DATA FLOW SEQUENCE |
| |
| 1. User connects wallet & deposits USDC |
| Frontend -> CrossMindVault.deposit(amount, riskLevel) |
| |
| 2. User chats with Zoya AI |
| Frontend -> Socket.io -> ElizaOS -> Socket.io -> Frontend |
| |
| 3. Zoya generates strategy |
| ElizaOS -> Contract queries -> Strategy generation |
| |
| 4. User confirms strategy |
| Frontend -> StrategyManager.confirmStrategy(strategyId) |
| |
| 5. Cross-chain execution |
| StrategyManager -> CrossChainExecutor -> CCIP Router |
| |
| 6. Destination chain receives message |
| CCIP Router -> Receiver Contract -> Protocol Adapters |
| |
| 7. Protocol interaction |
| Adapters -> External DeFi protocols (Aave, etc.) |
| |
| 8. Status updates |
| Contracts -> Events -> Frontend (status display) |
| |
+---------------------------------------------------------------+

+-------------------+ +-------------------+ +-------------------+
| | | | | |
| KEY TECHNOLOGIES | | SECURITY CONTROLS | | ERROR HANDLING |
| | | | | |
+-------------------+ +-------------------+ +-------------------+
| - Next.js | | - Balance locking | | - Tx errors |
| - ElizaOS | | - CCIP validation | | - CCIP failures |
| - AWS Bedrock | | - Access controls | | - Strategy |
| - Chainlink CCIP | | - Role-based auth | | validation |
| - Socket.io | | - Adapter vetting | | - AI fallbacks |
| - Wagmi/Viem | | | | |
+-------------------+ +-------------------+ +-------------------+

---

## 🧠 Core Features

- **AI Strategy Agent**: ElizaOS + AWS Bedrock to plan and execute personalized DeFi strategies.
- **Cross-Chain Execution**: Powered by Chainlink CCIP to bridge assets and logic across chains.
- **Yield Optimization**: Chooses best APYs from Aave, Lido, Curve, etc.
- **Chainlink Automation**: For continuous rebalancing and market responsiveness.
- **Transparency**: Every trade, strategy, and rebalance is logged and visible.

---

## 🔗 Chainlink Stack Usage

| Use Case             | Tool                       |
| -------------------- | -------------------------- |
| Cross-chain bridging | Chainlink CCIP             |
| Market price feeds   | Chainlink Price Feeds      |
| High-frequency data  | Chainlink Data Streams     |
| Rebalancing triggers | Chainlink Automation       |
| Collateral Proof     | Chainlink Proof of Reserve |

---

## ⚙️ Tech Stack

| Layer     | Stack                                         |
| --------- | --------------------------------------------- |
| Contracts | Solidity, Foundry, Chainlink                  |
| Frontend  | Next.js, TailwindCSS, Wagmi, RainbowKit       |
| Backend   | Node.js (TypeScript), Express, AWS SDK        |
| AI Agent  | ElizaOS, AWS Bedrock (Claude, Titan, Mistral) |
| Storage   | DynamoDB, S3 JSON-based logs                  |
| Indexing  | The Graph / Subsquid                          |
| Testing   | Foundry, Slither, MythX                       |

---

## ✅ Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/your-user/crossmind-protocol.git
cd crossmind-protocol

# 2. Install frontend and backend deps
cd frontend
npm install
cd ../backend
npm install

# 3. Setup .env
cp .env.example .env
# Fill in AWS keys, Chainlink keys, RPCs, Private Key, etc.

# 4. Compile Contracts
cd ../contracts
forge install
forge build

# 5. Run frontend
cd ../frontend
npm run dev

# 6. Run backend
cd ../backend
npm run dev
```

---

## 🧪 Testing Contracts

```bash
cd contracts
forge test
```

---

## ✨ License

MIT — Feel free to fork, improve, or contribute ❤️
Built for Chainlink Hackathon 2025.

```

---
```
