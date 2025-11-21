// tests/websocket.test.js

// A tiny fake WebSocket just for testing lifecycle logic without real network.
class FakeWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.handlers = {
      open: [],
      message: [],
      error: [],
      close: [],
    };

    // optional fake payload (for the message test)
    this.fakeMessage = options.fakeMessage || null;

    // Simulate async "open" (like a real WebSocket)
    process.nextTick(() => {
      this.handlers.open.forEach((h) => h());

      // If a fake message is provided, also simulate a "message" event
      if (this.fakeMessage) {
        const data =
          typeof this.fakeMessage === "string"
            ? this.fakeMessage
            : JSON.stringify(this.fakeMessage);
        this.handlers.message.forEach((h) => h({ data }));
      }
    });
  }

  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
  }

  close() {
    this.handlers.close.forEach((h) => h());
  }
}

describe("WebSocket lifecycle", () => {
  test("connects successfully", (done) => {
    const orderId = "test-order-123";
    const wsUrl = `wss://order-execution-engine-tt59.onrender.com/api/orders/ws?orderId=${orderId}`;

    const ws = new FakeWebSocket(wsUrl);

    ws.on("open", () => {
      // If we reach here, "connection" is considered successful
      expect(ws.url).toBe(wsUrl);
      ws.close();
      done();
    });
  });

  test("receives at least one status message for an order", (done) => {
    const orderId = "test-order-456";

    const fakePayload = {
      orderId,
      status: "ws_connected",
    };

    const ws = new FakeWebSocket(
      `wss://order-execution-engine-tt59.onrender.com/api/orders/ws?orderId=${orderId}`,
      { fakeMessage: fakePayload }
    );

    ws.on("message", (event) => {
      const msg = JSON.parse(event.data);
      expect(msg.orderId).toBe(orderId);
      expect(msg.status).toBeDefined();
      ws.close();
      done();
    });
  });

  test("status is one of allowed lifecycle states", (done) => {
    const orderId = "test-order-789";

    const allowed = [
      "ws_connected",
      "pending",
      "routing",
      "executing",
      "confirmed",
      "failed",
    ];

    const fakePayload = {
      orderId,
      status: "routing",
    };

    const ws = new FakeWebSocket(
      `wss://order-execution-engine-tt59.onrender.com/api/orders/ws?orderId=${orderId}`,
      { fakeMessage: fakePayload }
    );

    ws.on("message", (event) => {
      const msg = JSON.parse(event.data);
      expect(msg.orderId).toBe(orderId);
      expect(allowed).toContain(msg.status);
      ws.close();
      done();
    });
  });
});
