import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CONTEXTS = ["entry", "exit", "manual"] as const;

const marketPriceSnapshotSchema = new Schema(
  {
    symbol: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    source: { type: String, default: "coingecko" },
    context: { type: String, enum: CONTEXTS, required: true },
    tradeId: { type: String, default: null, index: true },
    recordedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

marketPriceSnapshotSchema.index({ symbol: 1, recordedAt: -1 });

export type MarketPriceSnapshotDoc = InferSchemaType<typeof marketPriceSnapshotSchema> & { _id: string };

export const MarketPriceSnapshotModel: Model<InferSchemaType<typeof marketPriceSnapshotSchema>> =
  models.MarketPriceSnapshot ?? model("MarketPriceSnapshot", marketPriceSnapshotSchema);
