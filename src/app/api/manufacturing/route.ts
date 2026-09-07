import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/manufacturing?status=&q=... → { items } (productName flattened)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await db.manufacturingOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { number: { contains: q } },
                { assignee: { contains: q } },
                { product: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const items = rows.map((m) => ({ ...m, productName: m.product?.name ?? null }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/manufacturing failed:", e);
    return NextResponse.json({ error: "Failed to load manufacturing orders" }, { status: 500 });
  }
}

// POST /api/manufacturing → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.productId || typeof body.productId !== "string") {
      return NextResponse.json({ error: "Product is required" }, { status: 400 });
    }
    const count = await db.manufacturingOrder.count();
    const number = body.number ? String(body.number).trim() : `MO${String(count + 1).padStart(4, "0")}`;
    const item = await db.manufacturingOrder.create({
      data: {
        number,
        productId: body.productId,
        qty: Number(body.qty || 1),
        status: ["draft", "confirmed", "in_progress", "done", "cancelled"].includes(body.status)
          ? body.status
          : "draft",
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        assignee: body.assignee || null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/manufacturing failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return NextResponse.json({ error: "Number already exists" }, { status: 400 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create manufacturing order" }, { status: 500 });
  }
}
