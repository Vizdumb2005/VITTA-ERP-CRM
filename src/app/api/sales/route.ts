import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/sales?status=&q=... → { items } (customerName + total flattened, lines included)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const orders = await db.saleOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { number: { contains: q } },
                { notes: { contains: q } },
                { customer: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { customer: { select: { name: true } }, lines: true },
      orderBy: { date: "desc" },
    });
    const items = orders.map((o) => ({
      ...o,
      customerName: o.customer?.name ?? null,
      total: o.lines.reduce((s, l) => s + l.qty * l.price, 0),
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/sales failed:", e);
    return NextResponse.json({ error: "Failed to load sales orders" }, { status: 500 });
  }
}

// POST /api/sales → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.customerId || typeof body.customerId !== "string") {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }
    const count = await db.saleOrder.count();
    const number = body.number ? String(body.number).trim() : `SO${String(count + 1).padStart(4, "0")}`;
    const lines = Array.isArray(body.lines)
      ? body.lines.map((l: { description?: unknown; qty?: unknown; price?: unknown }) => ({
          description: String(l?.description ?? "").trim(),
          qty: Number(l?.qty || 1),
          price: Number(l?.price || 0),
        }))
      : [];

    const item = await db.saleOrder.create({
      data: {
        number,
        customerId: body.customerId,
        ...(body.date ? { date: new Date(body.date) } : {}),
        status: ["quotation", "sent", "sale", "done", "cancel"].includes(body.status) ? body.status : "quotation",
        notes: body.notes || null,
        ...(lines.length ? { lines: { create: lines } } : {}),
      },
      include: { customer: { select: { name: true } }, lines: true },
    });
    return NextResponse.json(
      {
        item: {
          ...item,
          customerName: item.customer?.name ?? null,
          total: item.lines.reduce((s, l) => s + l.qty * l.price, 0),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/sales failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return NextResponse.json({ error: "Number already exists" }, { status: 400 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create sales order" }, { status: 500 });
  }
}
