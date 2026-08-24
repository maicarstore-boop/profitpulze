import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const DEPOSIT_STATUSES = [
  "waiting",
  "confirming",
  "confirmed",
  "sending",
  "finished",
  "failed",
  "refunded",
  "expired",
] as const;

const depositSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, unique: true },
    payCurrency: { type: String, required: true },
    payAddress: { type: String, required: true },
    payAmount: { type: Number, required: true },
    priceAmountUsd: { type: Number, required: true },
    actuallyPaid: { type: Number, default: 0 },
    status: { type: String, enum: DEPOSIT_STATUSES, default: "waiting" },
    expiresAt: { type: Date, default: null },
    creditedAt: { type: Date, default: null },
    rawIpnPayload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

depositSchema.index({ userId: 1, createdAt: -1 });

export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];
export type DepositDoc = InferSchemaType<typeof depositSchema> & { _id: string };

export const DepositModel: Model<InferSchemaType<typeof depositSchema>> =
  models.Deposit ?? model("Deposit", depositSchema);
