import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// Singleton document — there is only ever one PlatformSettings row (upserted by a fixed key).
export const SETTINGS_SINGLETON_KEY = "default";

const platformSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_SINGLETON_KEY },
    platformName: { type: String, default: "ProfitPulze" },
    supportEmail: { type: String, default: "support@profitpulze.com" },
    makerFeePercent: { type: Number, default: 0.1 },
    takerFeePercent: { type: Number, default: 0.1 },
    rateLimitPerMinute: { type: Number, default: 1200 },
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    websocketUrl: { type: String, default: "" },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type PlatformSettingsDoc = InferSchemaType<typeof platformSettingsSchema> & { _id: string };

export const PlatformSettingsModel: Model<InferSchemaType<typeof platformSettingsSchema>> =
  models.PlatformSettings ?? model("PlatformSettings", platformSettingsSchema);
