// src/services/dexRouter.ts
import { Order } from "../types/order";

export interface Quote {
  dex: "raydium" | "meteora";
  outAmount: number;
  estimatedPrice: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DexRouter {
  constructor(
    private connection: any,
    private wallet: any,
    private config: {
      raydiumPoolId: string;
      meteoraPool: string;
      tokenInMint: string;
      tokenOutMint: string;
      slippageTolerance?: number;   // <- add this line
    }
  ){}

  async getRaydiumQuote(order: Order): Promise<Quote> {
    await sleep(200); // simulate network delay

    const basePrice = 100; // pretend 1 SOL = 100 USDC
    const price = basePrice * (0.98 + Math.random() * 0.04); // ±2%
    const outAmount = order.amountIn * price;

    return {
      dex: "raydium",
      outAmount,
      estimatedPrice: price
    };
  }

  async getMeteoraQuote(order: Order): Promise<Quote> {
    await sleep(200);

    const basePrice = 100;
    const price = basePrice * (0.97 + Math.random() * 0.05); // ±3%
    const outAmount = order.amountIn * price;

    return {
      dex: "meteora",
      outAmount,
      estimatedPrice: price
    };
  }

  async getBestQuote(order: Order): Promise<Quote> {
    const [rayQuote, metQuote] = await Promise.all([
      this.getRaydiumQuote(order),
      this.getMeteoraQuote(order)
    ]);

    const bestQuote =
  rayQuote.outAmount >= metQuote.outAmount ? rayQuote : metQuote;

  console.log(
    "Routing decision:",
    "raydium out =", rayQuote.outAmount,
    "meteora out =", metQuote.outAmount,
    "chosen =", bestQuote.dex
);


    return rayQuote.outAmount >= metQuote.outAmount ? rayQuote : metQuote;
  }

  async executeSwap(bestDex: Quote, order: Order): Promise<{
    txHash: string;
    executedPrice: number;
  }> {
    await sleep(2000 + Math.random() * 1000); // 2–3s

    const randomSuffix = Math.floor(Math.random() * 1e8).toString(16);
    const txHash = `MOCK_${bestDex.dex.toUpperCase()}_${randomSuffix}`;

    return {
      txHash,
      executedPrice: bestDex.estimatedPrice
    };
  }
}
