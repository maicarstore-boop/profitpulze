import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ANNOUNCEMENT_SEVERITIES = ["info", "warning", "critical"] as const;

const announcementSchema = new Schema(
  {
    headline: { type: String, required: true, maxlength: 120 },
    message: { type: String, default: "", maxlength: 500 },
    severity: { type: String, enum: ANNOUNCEMENT_SEVERITIES, default: "info" },
    active: { type: Boolean, default: true },
    /** Optional auto-expiry; null means the banner stays up until unpublished. */
    expiresAt: { type: Date, default: null },
    publishedById: { type: String, required: true },
    publishedByEmail: { type: String, required: true },
    unpublishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

announcementSchema.index({ active: 1, createdAt: -1 });

export type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];
export type AnnouncementDoc = InferSchemaType<typeof announcementSchema> & { _id: string };

export const AnnouncementModel: Model<InferSchemaType<typeof announcementSchema>> =
  models.Announcement ?? model("Announcement", announcementSchema);
