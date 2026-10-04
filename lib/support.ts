import "server-only";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import {
  SupportConversationModel,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
} from "@/models/SupportConversation";

export class SupportError extends Error {}

interface Identity {
  userId: string;
  email: string;
}

type ConversationLean = NonNullable<Awaited<ReturnType<typeof getStaffConversation>>>;

export function serializeConversationSummary(c: ConversationLean) {
  const last = c.messages[c.messages.length - 1];
  return {
    id: c._id.toString(),
    userId: c.userId,
    userEmail: c.userEmail,
    subject: c.subject,
    category: c.category,
    status: c.status,
    priority: c.priority,
    assignedToEmail: c.assignedToEmail,
    unreadByUser: c.unreadByUser,
    unreadByStaff: c.unreadByStaff,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: last ? last.body.slice(0, 140) : "",
    lastMessageFrom: last?.senderType ?? null,
    createdAt: c.createdAt,
  };
}

export function serializeConversation(c: ConversationLean) {
  return {
    ...serializeConversationSummary(c),
    messages: c.messages.map((m) => ({
      id: m._id.toString(),
      senderType: m.senderType,
      senderEmail: m.senderEmail,
      body: m.body,
      createdAt: m.createdAt,
    })),
  };
}

export async function createConversation(
  user: Identity,
  input: { subject: string; category: SupportCategory; body: string }
) {
  await connectToDatabase();
  const now = new Date();
  const conversation = await SupportConversationModel.create({
    userId: user.userId,
    userEmail: user.email,
    subject: input.subject,
    category: input.category,
    messages: [{ senderId: user.userId, senderEmail: user.email, senderType: "user", body: input.body }],
    lastMessageAt: now,
    unreadByStaff: 1,
  });
  return conversation.toObject() as ConversationLean;
}

export async function listUserConversations(userId: string) {
  await connectToDatabase();
  return SupportConversationModel.find({ userId }).sort({ lastMessageAt: -1 }).limit(100).lean();
}

/** Fetches a conversation owned by the user and clears the user's unread counter. */
export async function getUserConversation(userId: string, id: string) {
  if (!isValidObjectId(id)) return null;
  await connectToDatabase();
  return SupportConversationModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: { unreadByUser: 0 } },
    { new: true }
  ).lean();
}

export async function postUserMessage(user: Identity, id: string, body: string) {
  if (!isValidObjectId(id)) throw new SupportError("Conversation not found.");
  await connectToDatabase();

  const existing = await SupportConversationModel.findOne({ _id: id, userId: user.userId }).select("status").lean();
  if (!existing) throw new SupportError("Conversation not found.");
  if (existing.status === "closed") {
    throw new SupportError("This conversation is closed. Start a new one if you still need help.");
  }

  const now = new Date();
  // A client reply reopens a resolved/pending conversation so it shows up in the staff queue again.
  return SupportConversationModel.findOneAndUpdate(
    { _id: id, userId: user.userId },
    {
      $push: { messages: { senderId: user.userId, senderEmail: user.email, senderType: "user", body } },
      $set: { lastMessageAt: now, status: "open", unreadByUser: 0 },
      $inc: { unreadByStaff: 1 },
    },
    { new: true }
  ).lean();
}

export async function listStaffConversations(filter: { status?: SupportStatus; user?: string; mine?: string }) {
  await connectToDatabase();
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.user) {
    const escaped = filter.user.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.userEmail = { $regex: escaped, $options: "i" };
  }
  if (filter.mine) query.assignedToId = filter.mine;
  return SupportConversationModel.find(query).sort({ lastMessageAt: -1 }).limit(200).lean();
}

export async function getStaffConversationCounts() {
  await connectToDatabase();
  const [byStatus, unread] = await Promise.all([
    SupportConversationModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    SupportConversationModel.countDocuments({ unreadByStaff: { $gt: 0 }, status: { $ne: "closed" } }),
  ]);
  return { byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])), unread };
}

/** Fetches any conversation for staff and clears the staff unread counter. */
export async function getStaffConversation(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectToDatabase();
  return SupportConversationModel.findByIdAndUpdate(id, { $set: { unreadByStaff: 0 } }, { new: true }).lean();
}

export async function postStaffMessage(staff: Identity, id: string, body: string) {
  if (!isValidObjectId(id)) throw new SupportError("Conversation not found.");
  await connectToDatabase();

  const existing = await SupportConversationModel.findById(id).select("status assignedToId").lean();
  if (!existing) throw new SupportError("Conversation not found.");

  const set: Record<string, unknown> = { lastMessageAt: new Date(), unreadByStaff: 0 };
  // Replying moves an open conversation to "pending" (awaiting the client) and
  // claims it for the replying agent if nobody owns it yet.
  if (existing.status === "open" || existing.status === "closed") set.status = "pending";
  if (!existing.assignedToId) {
    set.assignedToId = staff.userId;
    set.assignedToEmail = staff.email;
  }

  const updated = await SupportConversationModel.findByIdAndUpdate(
    id,
    {
      $push: { messages: { senderId: staff.userId, senderEmail: staff.email, senderType: "staff", body } },
      $set: set,
      $inc: { unreadByUser: 1 },
    },
    { new: true }
  ).lean();
  if (!updated) throw new SupportError("Conversation not found.");

  // The reply is already saved — a failed notification must not surface as a
  // failed send (the client still sees the message in their inbox).
  try {
    await createNotification({
      userId: updated.userId,
      type: "support_reply",
      title: "Support replied",
      message: `New reply on “${updated.subject}”: ${body.slice(0, 100)}`,
      relatedType: "SupportConversation",
      relatedId: updated._id.toString(),
    });
  } catch (error) {
    console.error(`Failed to notify user of support reply on ${updated._id.toString()}:`, error);
  }

  return updated;
}

export async function updateConversationMeta(
  staff: Identity,
  id: string,
  changes: { status?: SupportStatus; priority?: SupportPriority; assignToMe?: boolean; unassign?: boolean }
) {
  if (!isValidObjectId(id)) throw new SupportError("Conversation not found.");
  await connectToDatabase();

  const previous = await SupportConversationModel.findById(id).select("status priority assignedToEmail").lean();
  if (!previous) throw new SupportError("Conversation not found.");

  const set: Record<string, unknown> = {};
  if (changes.status) set.status = changes.status;
  if (changes.priority) set.priority = changes.priority;
  if (changes.assignToMe) {
    set.assignedToId = staff.userId;
    set.assignedToEmail = staff.email;
  } else if (changes.unassign) {
    set.assignedToId = null;
    set.assignedToEmail = null;
  }

  const updated = await SupportConversationModel.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
  if (!updated) throw new SupportError("Conversation not found.");

  return {
    updated,
    previous: { status: previous.status, priority: previous.priority, assignedToEmail: previous.assignedToEmail },
  };
}

export async function getUserUnreadCount(userId: string) {
  await connectToDatabase();
  const [result] = await SupportConversationModel.aggregate<{ total: number }>([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: "$unreadByUser" } } },
  ]);
  return result?.total ?? 0;
}
