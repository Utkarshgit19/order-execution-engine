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

### 🌐 Live Deployment

The backend is deployed on Render and publicly accessible at: https://order-execution-engine-tt59.onrender.com
Use this base URL to interact with the REST API and WebSocket endpoints.

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
## 📡 API Usage

### 📤 POST `/api/orders/execute`
Submit a **market order**.

#### 📝 Request Body
```json
{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 0.1,
  "type": "market"
}
```

#### 📥 Response
```json
{
  "orderId": "a116810c-d93d-4075-b838-969aaf1c61fb"
}
```

> ⚠️ The returned `orderId` will be used to subscribe via WebSocket.

---

## 🔌 WebSocket Updates

### URL
```
ws://<host>/api/orders/ws?orderId=<id>
```

#### Example
```
ws://localhost:3000/api/orders/ws?orderId=a116810c-d93d-4075-b838-969aaf1c61fb
```

#### 💬 Example WebSocket Messages
```json
{"status":"ws_connected","orderId":"..."}
{"status":"pending"}
{"status":"routing"}
{"status":"building","dexChosen":"raydium"}
{"status":"submitted","txHash":"MOCK_RAYDIUM_abc123"}
{"status":"confirmed","txHash":"MOCK_RAYDIUM_abc123","executedPrice":99.2}
```

---

## 🏗️ Design Decisions

### 💱 Market Orders Only
Supports **only market orders** to keep the demo focused on:
- DEX routing
- Worker + Queue infra
- Real-time execution updates  
Not price-time priority or order books.

### 🌀 Mock Raydium + Meteora Router
`DexRouter` implements `getBestQuote()` and `executeSwap()` with **mock prices + txHashes** because:
- easier to run locally
- deterministic testing
- avoids breakage from changing Devnet pools  
The structure makes it easy to plug in real SDK calls later.

### 🎯 Queue + Background Worker
Decouples API from execution:
- API returns instantly
- worker handles retries/backoff
- scalable to multiple workers  
For simplicity, the worker runs in the same process but still uses **Redis/BullMQ**.

### 🔔 WebSocket Per Order
Backend keeps `orderId → WebSocket` mapping.  
If a client connects late, backend loads the **latest state from PostgreSQL** and sends a snapshot.

---

## 🎬 How to Run the Demo (3–5 concurrent orders)

1️⃣ Start the server:
```bash
npm run dev
```

2️⃣ In Postman (or any API tool):
- Send `POST /api/orders/execute` **3–5 times**
- Collect the returned `orderId`s

3️⃣ For each orderId, open WebSocket:
```
ws://<host>/api/orders/ws?orderId=<id>
```

4️⃣ Watch statuses progress in real time:
```
pending → routing → building → submitted → confirmed
```

📌 The server logs show DEX decisions (Raydium / Meteora).

---

## 🧪 Tests

Tests cover:
- routing logic
- queue/worker flow
- WebSocket broadcasts  

Run:
```bash
npm test
```
### 💱 Why Only Market Orders?

This engine intentionally supports **only market orders** instead of limit or conditional orders.  
The goal of the project is to demonstrate a **DEX execution pipeline**, not an entire trading system.

#### 🔍 Why Market Orders?
Market orders execute **immediately at the best available price**, which aligns perfectly with the architecture of this project:

- 🔁 **Real-time routing** (Raydium vs. Meteora mock quotes)
- ⚙️ **Background execution via BullMQ**
- 📡 **Live WebSocket status updates**
- 💾 **Instant database persistence**

Because they are executed immediately, they avoid complex waiting/monitoring logic.

#### 🚫 Why Not Limit or Conditional Orders (Yet)?
Supporting limit orders would require:
- ⏱️ Price monitoring or order book subscriptions
- 🔔 Trigger logic to execute when price is reached
- 🚫 Order expiration or rejection conditions
- 📌 Persistent delayed queues and more DB states

This would shift the focus away from **execution architecture** and into **market logic + matching**, which is **not the purpose** of this task.

#### 🎯 Conclusion
Choosing market orders keeps the project:
- **Focused** on execution infrastructure
- **Simple to test** (no waiting for price triggers)
- **Close to real trading flows**
- **Extendable** — limit orders can be added later via a trigger layer, without major rewrites

> 📌 The current design intentionally isolates routing + execution, so adding limit orders later would require adding a **price trigger layer**, not rebuilding the engine.
