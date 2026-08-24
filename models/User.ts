import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ALL_ROLES } from "@/lib/auth/roles";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "frozen", "suspended"],
      default: "active",
    },
    kycStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: null,
      select: false,
    },
    tradingSuspended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema> & { _id: string };

export const UserModel: Model<InferSchemaType<typeof userSchema>> =
  models.User ?? model("User", userSchema);
