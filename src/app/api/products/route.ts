import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/products?type=&q=... → { items }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const items = await db.product.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { sku: { contains: q } },
                { category: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/products failed:", e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

// POST /api/products → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body?.sku || typeof body.sku !== "string" || !body.sku.trim()) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }
    const sku = body.sku.trim();
    const existing = await db.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    const item = await db.product.create({
      data: {
        name: body.name.trim(),
        sku,
        category: body.category || null,
        type: ["goods", "service"].includes(body.type) ? body.type : "goods",
        price: Number(body.price || 0),
        cost: Number(body.cost || 0),
        qty: Number(body.qty || 0),
        unit: body.unit || "Units",
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/products failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
