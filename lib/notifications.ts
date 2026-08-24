import "server-only";
import { connectToDatabase } from "@/lib/db";
import { NotificationModel, type NotificationType } from "@/models/Notification";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedType?: string;
  relatedId?: string;
}) {
  await connectToDatabase();
  await NotificationModel.create(input);
}

export async function getUserNotifications(userId: string, limit = 50) {
  await connectToDatabase();
  return NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await connectToDatabase();
  await NotificationModel.updateOne({ _id: notificationId, userId }, { $set: { read: true } });
}
