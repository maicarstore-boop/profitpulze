import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { BinaryTradeModel } from "@/models/BinaryTrade";
import { UserModel } from "@/models/User";
import { recordAuditLog } from "@/lib/audit";
import { cancelTrade, TradeError } from "@/lib/binary-trading";

const ACTIONS = [
  "cancel",
  "flag",
  "resolve",
  "note",
  "freeze_account",
  "unfreeze_account",
  "suspend_trading",
  "unsuspend_trading",
] as const;
type Action = (typeof ACTIONS)[number];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Trading");
  await connectToDatabase();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== "string" || !ACTIONS.includes(body.action as Action)) {
    return NextResponse.json({ error: "Invalid or missing action." }, { status: 400 });
  }
  const action = body.action as Action;
  const reason: string = typeof body.reason === "string" ? body.reason.trim() : "";
  const note: string = typeof body.note === "string" ? body.note.trim() : "";

  const trade = await BinaryTradeModel.findById(id).lean();
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const auditBase = {
    adminId: admin.userId,
    adminEmail: admin.email,
    request,
  };

  try {
    switch (action) {
      case "cancel": {
        if (!reason) {
          return NextResponse.json({ error: "A reason is required to cancel a trade." }, { status: 400 });
        }
        const updated = await cancelTrade(id, reason);
        await recordAuditLog({
          ...auditBase,
          action: "binary_trade.cancel",
          targetType: "BinaryTrade",
          targetId: id,
          previousValue: { status: trade.status },
          newValue: { status: updated.status, cancelReason: reason },
          reason,
        });
        return NextResponse.json({ trade: { id, status: updated.status } });
      }

      case "flag":
      case "resolve": {
        const flagged = action === "flag";
        const updated = await BinaryTradeModel.findByIdAndUpdate(
          id,
          { $set: { flagged, ...(note ? { adminNote: note } : {}) } },
          { new: true }
        ).lean();
        await recordAuditLog({
          ...auditBase,
          action: flagged ? "binary_trade.flag" : "binary_trade.resolve",
          targetType: "BinaryTrade",
          targetId: id,
          previousValue: { flagged: trade.flagged },
          newValue: { flagged },
          reason: reason || note,
        });
        return NextResponse.json({ trade: { id, flagged: updated?.flagged } });
      }

      case "note": {
        if (!note) {
          return NextResponse.json({ error: "Note text is required." }, { status: 400 });
        }
        await BinaryTradeModel.findByIdAndUpdate(id, { $set: { adminNote: note } });
        await recordAuditLog({
          ...auditBase,
          action: "binary_trade.note",
          targetType: "BinaryTrade",
          targetId: id,
          previousValue: { adminNote: trade.adminNote },
          newValue: { adminNote: note },
          reason,
        });
        return NextResponse.json({ trade: { id, adminNote: note } });
      }

      case "freeze_account":
      case "unfreeze_account": {
        const newStatus = action === "freeze_account" ? "frozen" : "active";
        const user = await UserModel.findByIdAndUpdate(trade.userId, { $set: { status: newStatus } }, { new: true }).lean();
        await recordAuditLog({
          ...auditBase,
          action: `user.${action}`,
          targetType: "User",
          targetId: trade.userId,
          previousValue: { status: user?.status === newStatus ? undefined : "active" },
          newValue: { status: newStatus },
          reason,
        });
        return NextResponse.json({ user: { id: trade.userId, status: newStatus } });
      }

      case "suspend_trading":
      case "unsuspend_trading": {
        const tradingSuspended = action === "suspend_trading";
        await UserModel.findByIdAndUpdate(trade.userId, { $set: { tradingSuspended } });
        await recordAuditLog({
          ...auditBase,
          action: `user.${action}`,
          targetType: "User",
          targetId: trade.userId,
          previousValue: { tradingSuspended: !tradingSuspended },
          newValue: { tradingSuspended },
          reason,
        });
        return NextResponse.json({ user: { id: trade.userId, tradingSuspended } });
      }
    }
  } catch (error) {
    if (error instanceof TradeError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(`POST /api/admin/binary-trades/${id}/actions:`, error);
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
