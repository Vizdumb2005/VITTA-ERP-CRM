import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/pos?limit=30&q=... → { items } (items parsed back from JSON string)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const limit = Math.max(1, Number(searchParams.get("limit")) || 30);

    const rows = await db.posOrder.findMany({
      where: {
        ...(q ? { OR: [{ number: { contains: q } }, { cashier: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const items = rows.map((o) => {
      let parsed: unknown = [];
      try {
        parsed = JSON.parse(o.items);
      } catch {
        parsed = [];
      }
      return { ...o, items: Array.isArray(parsed) ? parsed : [] };
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/pos failed:", e);
    return NextResponse.json({ error: "Failed to load POS orders" }, { status: 500 });
  }
}

// POST /api/pos → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await db.posOrder.count();
    const number = body.number ? String(body.number).trim() : `POS${String(count + 1).padStart(4, "0")}`;
    const item = await db.posOrder.create({
      data: {
        number,
        total: Number(body.total || 0),
        itemsCount: Math.round(Number(body.itemsCount || 0)),
        items: Array.isArray(body.items)
          ? JSON.stringify(body.items)
          : typeof body.items === "string" && body.items.trim()
            ? body.items
            : "[]",
        paymentMethod: ["cash", "card", "upi"].includes(body.paymentMethod) ? body.paymentMethod : "cash",
        cashier: body.cashier || "Aarav Mehta",
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/pos failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create POS order" }, { status: 500 });
  }
}
