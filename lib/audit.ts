import "server-only";
import { connectToDatabase } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";

export interface RecordAuditLogInput {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
  request: Request;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function recordAuditLog({
  adminId,
  adminEmail,
  action,
  targetType,
  targetId,
  previousValue,
  newValue,
  reason,
  request,
}: RecordAuditLogInput) {
  await connectToDatabase();
  await AuditLogModel.create({
    adminId,
    adminEmail,
    action,
    targetType,
    targetId,
    previousValue,
    newValue,
    reason,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? "unknown",
  });
}
