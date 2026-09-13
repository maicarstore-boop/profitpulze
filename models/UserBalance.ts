import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const DEMO_STARTING_BALANCE = 10_000;

const userBalanceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    currency: { type: String, default: "USDT" },
    available: { type: Number, required: true, default: DEMO_STARTING_BALANCE },
    // Funds reserved against pending withdrawals. `available` stays spendable;
    // total balance shown to the user is `available + locked`.
    locked: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export type UserBalanceDoc = InferSchemaType<typeof userBalanceSchema> & { _id: string };

export const UserBalanceModel: Model<InferSchemaType<typeof userBalanceSchema>> =
  models.UserBalance ?? model("UserBalance", userBalanceSchema);
