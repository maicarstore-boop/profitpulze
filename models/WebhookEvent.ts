import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const webhookEventSchema = new Schema(
  {
    provider: { type: String, required: true, default: "nowpayments" },
    // `${paymentId|payoutId}:${status}` — lets an identical IPN retry no-op while a
    // genuine status transition (e.g. waiting -> finished) still gets processed.
    dedupeKey: { type: String, required: true, unique: true },
    signatureValid: { type: Boolean, required: true },
    rawPayload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

export type WebhookEventDoc = InferSchemaType<typeof webhookEventSchema> & { _id: string };

export const WebhookEventModel: Model<InferSchemaType<typeof webhookEventSchema>> =
  models.WebhookEvent ?? model("WebhookEvent", webhookEventSchema);
