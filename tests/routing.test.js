// tests/routing.test.js
const { chooseBestRoute } = require("../src/services/routing");

describe("Routing logic – chooseBestRoute", () => {
  test("picks Raydium when Raydium output is higher", () => {
    const result = chooseBestRoute({ raydiumOut: 10.5, meteoraOut: 9.8 });
    expect(result.dex).toBe("raydium");
  });

  test("picks Meteora when Meteora output is higher", () => {
    const result = chooseBestRoute({ raydiumOut: 8.9, meteoraOut: 9.3 });
    expect(result.dex).toBe("meteora");
  });

  test("on tie, defaults to Raydium", () => {
    const result = chooseBestRoute({ raydiumOut: 10, meteoraOut: 10 });
    expect(result.dex).toBe("raydium");
  });
});
