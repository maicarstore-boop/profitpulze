import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const POOL_TYPES = ["flexible", "locked"] as const;

const stakingPoolSchema = new Schema(
  {
    symbol: { type: String, required: true, default: "USDT" },
    type: { type: String, enum: POOL_TYPES, required: true },
    lockDays: { type: Number, required: true, default: 0 },
    apy: { type: Number, required: true, min: 0 },
    minStake: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type StakingPoolType = (typeof POOL_TYPES)[number];
export type StakingPoolDoc = InferSchemaType<typeof stakingPoolSchema> & { _id: string };

export const StakingPoolModel: Model<InferSchemaType<typeof stakingPoolSchema>> =
  models.StakingPool ?? model("StakingPool", stakingPoolSchema);
