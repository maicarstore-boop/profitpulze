import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const marketListingSchema = new Schema(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true },
    delisted: { type: Boolean, default: false },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

export type MarketListingDoc = InferSchemaType<typeof marketListingSchema> & { _id: string };

export const MarketListingModel: Model<InferSchemaType<typeof marketListingSchema>> =
  models.MarketListing ?? model("MarketListing", marketListingSchema);
