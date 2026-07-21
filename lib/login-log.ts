import "server-only";
import { connectToDatabase } from "@/lib/db";
import { LoginLogModel } from "@/models/LoginLog";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function recordLoginAttempt({
  email,
  userId,
  status,
  reason,
  provider = "credentials",
  request,
}: {
  email: string;
  userId?: string;
  status: "success" | "failed";
  reason?: string;
  provider?: string;
  request: Request;
}) {
  await connectToDatabase();
  await LoginLogModel.create({
    userId: userId ?? null,
    email,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? "unknown",
    status,
    reason: reason ?? "",
    provider,
  });
}
