import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TRANSACTION_TYPES = [
  "deposit",
  "withdrawal",
  "trade_stake",
  "trade_payout",
  "trade_refund",
  "stake_lock",
  "stake_unlock",
  "stake_reward",
] as const;

const transactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true }, // signed: negative debits, positive credits
    balanceAfter: { type: Number, required: true },
    referenceType: { type: String, default: null },
    referenceId: { type: String, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionDoc = InferSchemaType<typeof transactionSchema> & { _id: string };

export const TransactionModel: Model<InferSchemaType<typeof transactionSchema>> =
  models.Transaction ?? model("Transaction", transactionSchema);
