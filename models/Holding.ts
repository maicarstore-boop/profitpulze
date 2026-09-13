import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const holdingSchema = new Schema(
  {
    userId: { type: String, required: true },
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

holdingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export type HoldingDoc = InferSchemaType<typeof holdingSchema> & { _id: string };

export const HoldingModel: Model<InferSchemaType<typeof holdingSchema>> =
  models.Holding ?? model("Holding", holdingSchema);
