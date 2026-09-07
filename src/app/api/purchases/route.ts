import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/purchases?status=&q=... → { items } (vendorName + total flattened, lines included)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const orders = await db.purchaseOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { number: { contains: q } },
                { notes: { contains: q } },
                { vendor: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { vendor: { select: { name: true } }, lines: true },
      orderBy: { date: "desc" },
    });
    const items = orders.map((o) => ({
      ...o,
      vendorName: o.vendor?.name ?? null,
      total: o.lines.reduce((s, l) => s + l.qty * l.price, 0),
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/purchases failed:", e);
    return NextResponse.json({ error: "Failed to load purchase orders" }, { status: 500 });
  }
}

// POST /api/purchases → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.vendorId || typeof body.vendorId !== "string") {
      return NextResponse.json({ error: "Vendor is required" }, { status: 400 });
    }
    const count = await db.purchaseOrder.count();
    const number = body.number ? String(body.number).trim() : `PO${String(count + 1).padStart(4, "0")}`;
    const lines = Array.isArray(body.lines)
      ? body.lines.map((l: { description?: unknown; qty?: unknown; price?: unknown }) => ({
          description: String(l?.description ?? "").trim(),
          qty: Number(l?.qty || 1),
          price: Number(l?.price || 0),
        }))
      : [];

    const item = await db.purchaseOrder.create({
      data: {
        number,
        vendorId: body.vendorId,
        ...(body.date ? { date: new Date(body.date) } : {}),
        status: ["rfq", "confirmed", "received", "cancel"].includes(body.status) ? body.status : "rfq",
        notes: body.notes || null,
        ...(lines.length ? { lines: { create: lines } } : {}),
      },
      include: { vendor: { select: { name: true } }, lines: true },
    });
    return NextResponse.json(
      {
        item: {
          ...item,
          vendorName: item.vendor?.name ?? null,
          total: item.lines.reduce((s, l) => s + l.qty * l.price, 0),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/purchases failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return NextResponse.json({ error: "Number already exists" }, { status: 400 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
