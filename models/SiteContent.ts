import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const SITE_CONTENT_SINGLETON_KEY = "default";

const bannerSchema = new Schema(
  { text: { type: String, required: true }, active: { type: Boolean, default: true } },
  { _id: true }
);

const siteContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: SITE_CONTENT_SINGLETON_KEY },
    heroHeadline: { type: String, default: "Trade crypto with confidence" },
    heroSubheadline: {
      type: String,
      default: "Spot, margin, and futures trading with institutional-grade infrastructure.",
    },
    banners: { type: [bannerSchema], default: [] },
  },
  { timestamps: true }
);

export type SiteContentDoc = InferSchemaType<typeof siteContentSchema> & { _id: string };

export const SiteContentModel: Model<InferSchemaType<typeof siteContentSchema>> =
  models.SiteContent ?? model("SiteContent", siteContentSchema);
