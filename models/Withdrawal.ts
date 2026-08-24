import "server-only";
import { Schema, model, models, type InferSchemaType, type Model, type HydratedDocument } from "mongoose";

export const WITHDRAWAL_STATUSES = ["pending", "approved", "rejected", "processing", "completed", "failed"] as const;

const withdrawalSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    currency: { type: String, required: true },
    network: { type: String, required: true },
    address: { type: String, required: true },
    amountUsd: { type: Number, required: true },
    estimatedCryptoAmount: { type: Number, default: null },
    status: { type: String, enum: WITHDRAWAL_STATUSES, default: "pending" },
    autoApproved: { type: Boolean, default: false },
    approvedBy: { type: String, default: null },
    rejectedReason: { type: String, default: null },
    nowPaymentsPayoutId: { type: String, default: null },
    failureReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];
export type WithdrawalDoc = InferSchemaType<typeof withdrawalSchema> & { _id: string };
export type WithdrawalHydrated = HydratedDocument<InferSchemaType<typeof withdrawalSchema>>;

export const WithdrawalModel: Model<InferSchemaType<typeof withdrawalSchema>> =
  models.Withdrawal ?? model("Withdrawal", withdrawalSchema);
