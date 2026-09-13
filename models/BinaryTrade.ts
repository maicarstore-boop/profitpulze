import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CONTRACT_STYLES = ["higher_lower", "call_put", "up_down"] as const;
const DIRECTIONS = ["up", "down"] as const;
const STATUSES = ["open", "settled", "cancelled"] as const;
const RESULTS = ["win", "lose", "draw"] as const;

const binaryTradeSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    contractStyle: { type: String, enum: CONTRACT_STYLES, required: true },
    direction: { type: String, enum: DIRECTIONS, required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, default: null },
    stake: { type: Number, required: true, min: 1 },
    payoutRate: { type: Number, required: true },
    potentialPayout: { type: Number, required: true },
    durationSeconds: { type: Number, required: true },
    openedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: "open", index: true },
    result: { type: String, enum: RESULTS, default: null },
    profitLoss: { type: Number, default: null },
    priceSource: { type: String, default: "coingecko" },
    flagged: { type: Boolean, default: false },
    adminNote: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
  },
  { timestamps: true }
);

binaryTradeSchema.index({ status: 1, expiresAt: 1 });
binaryTradeSchema.index({ userId: 1, createdAt: -1 });
binaryTradeSchema.index({ symbol: 1 });

export type BinaryTradeDoc = InferSchemaType<typeof binaryTradeSchema> & { _id: string };
export type ContractStyle = (typeof CONTRACT_STYLES)[number];
export type TradeDirection = (typeof DIRECTIONS)[number];
export type TradeStatus = (typeof STATUSES)[number];
export type TradeResult = (typeof RESULTS)[number];

export const BinaryTradeModel: Model<InferSchemaType<typeof binaryTradeSchema>> =
  models.BinaryTrade ?? model("BinaryTrade", binaryTradeSchema);
