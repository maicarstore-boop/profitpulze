import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const NOTIFICATION_TYPES = [
  "deposit_detected",
  "deposit_confirmed",
  "withdrawal_submitted",
  "withdrawal_approved",
  "withdrawal_completed",
  "withdrawal_failed",
] as const;

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedType: { type: String, default: null },
    relatedId: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: string };

export const NotificationModel: Model<InferSchemaType<typeof notificationSchema>> =
  models.Notification ?? model("Notification", notificationSchema);
