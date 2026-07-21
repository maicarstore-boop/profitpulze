import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { BinaryTradeModel, type ContractStyle, type TradeDirection } from "@/models/BinaryTrade";
import { openTrade, settleDueTrades, TradeError } from "@/lib/binary-trading";
import { checkRateLimit } from "@/lib/rate-limit";

const CONTRACT_STYLES: ContractStyle[] = ["higher_lower", "call_put", "up_down"];
const DIRECTIONS: TradeDirection[] = ["up", "down"];
const STATUS_FILTERS = ["open", "settled", "cancelled"] as const;

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const session = await verifySession();
  await settleDueTrades();
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const symbol = searchParams.get("symbol")?.trim();
  const format = searchParams.get("format");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 500);

  const filter: Record<string, unknown> = { userId: session.userId };
  if (status && (STATUS_FILTERS as readonly string[]).includes(status)) {
    filter.status = status;
  }
  if (symbol) filter.symbol = symbol.toUpperCase();

  const trades = await BinaryTradeModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  const shaped = trades.map((t) => ({
    id: t._id.toString(),
    symbol: t.symbol,
    contractStyle: t.contractStyle,
    direction: t.direction,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    stake: t.stake,
    payoutRate: t.payoutRate,
    potentialPayout: t.potentialPayout,
    durationSeconds: t.durationSeconds,
    openedAt: t.openedAt,
    expiresAt: t.expiresAt,
    status: t.status,
    result: t.result,
    profitLoss: t.profitLoss,
    createdAt: t.createdAt,
  }));

  if (format === "csv") {
    const csv = toCsv(shaped);
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename="my-trades-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ trades: shaped });
}

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`open-trade:${session.userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many trade requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { symbol, contractStyle, direction, stake, durationSeconds } = body as Record<string, unknown>;

  if (typeof symbol !== "string" || !symbol.trim()) {
    return NextResponse.json({ error: "A trading pair symbol is required." }, { status: 400 });
  }
  if (typeof contractStyle !== "string" || !CONTRACT_STYLES.includes(contractStyle as ContractStyle)) {
    return NextResponse.json({ error: "Invalid contract style." }, { status: 400 });
  }
  if (typeof direction !== "string" || !DIRECTIONS.includes(direction as TradeDirection)) {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }
  if (typeof stake !== "number" || !Number.isFinite(stake)) {
    return NextResponse.json({ error: "Invalid stake amount." }, { status: 400 });
  }
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds)) {
    return NextResponse.json({ error: "Invalid duration." }, { status: 400 });
  }

  try {
    const trade = await openTrade({
      userId: session.userId,
      symbol,
      contractStyle: contractStyle as ContractStyle,
      direction: direction as TradeDirection,
      stake,
      durationSeconds,
    });

    return NextResponse.json(
      {
        trade: {
          id: trade._id.toString(),
          symbol: trade.symbol,
          contractStyle: trade.contractStyle,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          stake: trade.stake,
          payoutRate: trade.payoutRate,
          potentialPayout: trade.potentialPayout,
          durationSeconds: trade.durationSeconds,
          openedAt: trade.openedAt,
          expiresAt: trade.expiresAt,
          status: trade.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof TradeError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("POST /api/binary/trades:", error);
    return NextResponse.json({ error: "Failed to open trade." }, { status: 500 });
  }
}
