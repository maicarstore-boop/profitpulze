import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const newsArticleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

newsArticleSchema.index({ createdAt: -1 });

export type NewsArticleDoc = InferSchemaType<typeof newsArticleSchema> & { _id: string };

export const NewsArticleModel: Model<InferSchemaType<typeof newsArticleSchema>> =
  models.NewsArticle ?? model("NewsArticle", newsArticleSchema);
