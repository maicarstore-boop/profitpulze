import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const STATUSES = ["success", "failed"] as const;

const loginLogSchema = new Schema(
  {
    userId: { type: String, default: null, index: true },
    email: { type: String, required: true },
    ip: { type: String, default: "unknown" },
    userAgent: { type: String, default: "unknown" },
    status: { type: String, enum: STATUSES, required: true },
    reason: { type: String, default: "" },
    provider: { type: String, default: "credentials" },
  },
  { timestamps: true }
);

loginLogSchema.index({ createdAt: -1 });

export type LoginLogDoc = InferSchemaType<typeof loginLogSchema> & { _id: string };

export const LoginLogModel: Model<InferSchemaType<typeof loginLogSchema>> =
  models.LoginLog ?? model("LoginLog", loginLogSchema);
