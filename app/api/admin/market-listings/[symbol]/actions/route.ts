import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { MarketListingModel } from "@/models/MarketListing";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const admin = await requirePermission("Markets");
  await connectToDatabase();

  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const body = await request.json().catch(() => null);
  const action = body?.action;
  const reason: string = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (action !== "delist" && action !== "relist") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  if (action === "delist" && !reason) {
    return NextResponse.json({ error: "A reason is required to delist a pair." }, { status: 400 });
  }

  const delisted = action === "delist";
  const previous = await MarketListingModel.findOne({ symbol }).lean();

  await MarketListingModel.findOneAndUpdate(
    { symbol },
    { $set: { delisted, reason: delisted ? reason : "" } },
    { upsert: true }
  );

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: `market.${action}`,
    targetType: "MarketListing",
    targetId: symbol,
    previousValue: { delisted: previous?.delisted ?? false },
    newValue: { delisted },
    reason,
    request,
  });

  return NextResponse.json({ symbol, delisted });
}
