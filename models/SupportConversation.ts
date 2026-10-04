import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const SUPPORT_CATEGORIES = [
  "Account & Verification",
  "Deposits & Withdrawals",
  "Trading",
  "Security",
  "Other",
] as const;

export const SUPPORT_STATUSES = ["open", "pending", "resolved", "closed"] as const;
export const SUPPORT_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const supportMessageSchema = new Schema(
  {
    senderId: { type: String, required: true },
    senderEmail: { type: String, required: true },
    /** "user" for the client, "staff" for any admin role replying. */
    senderType: { type: String, enum: ["user", "staff"], required: true },
    body: { type: String, required: true, maxlength: 5000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const supportConversationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    subject: { type: String, required: true, maxlength: 200 },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true },
    status: { type: String, enum: SUPPORT_STATUSES, default: "open" },
    priority: { type: String, enum: SUPPORT_PRIORITIES, default: "medium" },
    assignedToId: { type: String, default: null },
    assignedToEmail: { type: String, default: null },
    messages: { type: [supportMessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
    unreadByUser: { type: Number, default: 0 },
    unreadByStaff: { type: Number, default: 0 },
  },
  { timestamps: true }
);

supportConversationSchema.index({ userId: 1, lastMessageAt: -1 });
supportConversationSchema.index({ status: 1, lastMessageAt: -1 });

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export type SupportConversationDoc = InferSchemaType<typeof supportConversationSchema> & { _id: string };

export const SupportConversationModel: Model<InferSchemaType<typeof supportConversationSchema>> =
  models.SupportConversation ?? model("SupportConversation", supportConversationSchema);
