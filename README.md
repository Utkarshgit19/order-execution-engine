# Order Execution Engine (Mock Devnet – Raydium + Meteora Routing)

This is an order execution engine built as part of an application task.

- Accepts **market orders** via REST API
- Enqueues orders into a **BullMQ** queue
- Processes them with a background **worker**
- Routes between **mock Raydium and Meteora DEX quotes**
- Streams live status updates over **WebSocket**
- Persists order lifecycle into **PostgreSQL**

> ⚠️ Swaps are **mocked** (no real Solana execution) but the architecture mirrors a real DEX router and can be extended to Raydium/Meteora SDKs.

---

## Architecture Overview

- **Fastify** + `@fastify/websocket` – HTTP & WS server
- **BullMQ + Redis** – job queue and background worker
- **PostgreSQL** – `orders` table (status, dexChosen, txHash, executedPrice)
- **DexRouter** – compares Raydium vs Meteora mock quotes and picks best
- **WebSockets** – one WS per orderId for live status

Order lifecycle:

1. Client `POST /api/orders/execute`
2. API validates request, creates DB row with `status=pending`, enqueues job
3. Worker:
   - loads order from DB
   - simulates routing (Raydium vs Meteora)
   - simulates swap execution
   - updates DB + pushes statuses to WebSocket
4. Client listens on `WS /api/orders/ws?orderId=...` to see:
   `pending → routing → building → submitted → confirmed`

---

# Setup Instructions

### 1️⃣ Clone & Install
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
```

### 2️⃣ Create the PostgreSQL Database
```sql
CREATE DATABASE orders_db;
```

### 3️⃣ Start Redis (Docker)
```bash
docker run -p 6379:6379 --name redis-dev -d redis:latest
```

### 4️⃣ Create a `.env` File
Add the following:
```
PORT=3000

PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=orders_db

REDIS_URL=redis://localhost:6379

SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 5️⃣ Start the Server
```bash
npm run dev
```

### 📌 Result
If everything is correct, the terminal should show:
```
Order worker started
Server listening on http://localhost:3000
```
