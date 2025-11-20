const orderSockets = new Map<string, any>();

export function registerOrderSocket(orderId: string, socket: any) {
  if (!socket) {
    console.error("registerOrderSocket: socket is undefined for orderId:", orderId);
    return;
  }

  orderSockets.set(orderId, socket);

  if (typeof socket.on === "function") {
    socket.on("close", () => {
      orderSockets.delete(orderId);
      console.log("WS closed for orderId", orderId);
    });
  } else if (typeof socket.addEventListener === "function") {
    socket.addEventListener("close", () => {
      orderSockets.delete(orderId);
      console.log("WS closed for orderId", orderId);
    });
  }
}

export function sendOrderStatus(orderId: string, payload: Record<string, unknown>) {
  const socket = orderSockets.get(orderId);
  if (!socket) return;
  try {
    socket.send(JSON.stringify(payload));
  } catch (err) {
    console.error("Error sending WS message for orderId", orderId, err);
  }
}
