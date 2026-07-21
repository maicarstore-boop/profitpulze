export interface P2POffer {
  id: string;
  merchant: string;
  completionRate: number;
  orders: number;
  asset: string;
  price: number;
  currency: string;
  available: number;
  limitMin: number;
  limitMax: number;
  paymentMethods: string[];
  side: "buy" | "sell";
}

export const p2pOffers: P2POffer[] = [
  { id: "p2p-1", merchant: "CryptoHaven", completionRate: 99.2, orders: 4210, asset: "USDT", price: 1.001, currency: "USD", available: 45000, limitMin: 100, limitMax: 10000, paymentMethods: ["Bank Transfer", "Zelle"], side: "sell" },
  { id: "p2p-2", merchant: "NovaTrade", completionRate: 98.7, orders: 2894, asset: "USDT", price: 0.998, currency: "USD", available: 22000, limitMin: 50, limitMax: 5000, paymentMethods: ["PayPal", "Bank Transfer"], side: "buy" },
  { id: "p2p-3", merchant: "SwiftFi", completionRate: 99.8, orders: 6710, asset: "BTC", price: 96910.5, currency: "USD", available: 3.4, limitMin: 200, limitMax: 20000, paymentMethods: ["Wire Transfer"], side: "sell" },
  { id: "p2p-4", merchant: "MeridianOTC", completionRate: 97.9, orders: 1520, asset: "ETH", price: 3689.2, currency: "USD", available: 58, limitMin: 100, limitMax: 15000, paymentMethods: ["Bank Transfer", "Revolut"], side: "sell" },
  { id: "p2p-5", merchant: "ClearPath", completionRate: 99.4, orders: 3305, asset: "USDT", price: 1.0, currency: "EUR", available: 31000, limitMin: 50, limitMax: 8000, paymentMethods: ["SEPA"], side: "buy" },
];
