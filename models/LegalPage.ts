import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const legalPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

export type LegalPageDoc = InferSchemaType<typeof legalPageSchema> & { _id: string };

export const LegalPageModel: Model<InferSchemaType<typeof legalPageSchema>> =
  models.LegalPage ?? model("LegalPage", legalPageSchema);
