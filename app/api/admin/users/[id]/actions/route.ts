import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { recordAuditLog } from "@/lib/audit";

const ACTIONS = ["freeze", "unfreeze", "suspend", "reactivate", "reset_2fa", "kyc_approve", "kyc_reject"] as const;

const schema = z.object({
  action: z.enum(ACTIONS),
  reason: z.string().optional(),
});

const STATUS_BY_ACTION: Partial<Record<(typeof ACTIONS)[number], "active" | "frozen" | "suspended">> = {
  freeze: "frozen",
  unfreeze: "active",
  suspend: "suspended",
  reactivate: "active",
};

const KYC_BY_ACTION: Partial<Record<(typeof ACTIONS)[number], "approved" | "rejected">> = {
  kyc_approve: "approved",
  kyc_reject: "rejected",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Users");
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  if (id === admin.userId) {
    return NextResponse.json({ error: "You cannot perform this action on your own account." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { action, reason } = parsed.data;
  let previousValue: unknown;
  let newValue: unknown;

  if (action in STATUS_BY_ACTION) {
    previousValue = { status: user.status };
    user.status = STATUS_BY_ACTION[action]!;
    newValue = { status: user.status };
  } else if (action in KYC_BY_ACTION) {
    previousValue = { kycStatus: user.kycStatus };
    user.kycStatus = KYC_BY_ACTION[action]!;
    newValue = { kycStatus: user.kycStatus };
  } else if (action === "reset_2fa") {
    previousValue = { twoFactorEnabled: user.twoFactorEnabled };
    user.twoFactorEnabled = false;
    newValue = { twoFactorEnabled: false };
  }

  await user.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: `user.${action}`,
    targetType: "User",
    targetId: id,
    previousValue,
    newValue,
    reason,
    request,
  });

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      status: user.status,
      kycStatus: user.kycStatus,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
}
