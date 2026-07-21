import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const STATUSES = ["active", "unstaked"] as const;

const stakingPositionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    poolId: { type: String, required: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ["flexible", "locked"], required: true },
    lockDays: { type: Number, required: true },
    apy: { type: Number, required: true }, // snapshot from the pool at stake time — doesn't change if the pool's APY is later edited
    principal: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, required: true },
    unlocksAt: { type: Date, default: null },
    status: { type: String, enum: STATUSES, default: "active" },
    unstakedAt: { type: Date, default: null },
    rewardsPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

stakingPositionSchema.index({ userId: 1, createdAt: -1 });
stakingPositionSchema.index({ status: 1 });

export type StakingPositionDoc = InferSchemaType<typeof stakingPositionSchema> & { _id: string };

export const StakingPositionModel: Model<InferSchemaType<typeof stakingPositionSchema>> =
  models.StakingPosition ?? model("StakingPosition", stakingPositionSchema);
