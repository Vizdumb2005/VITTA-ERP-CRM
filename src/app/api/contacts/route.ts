import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/contacts?type=customer|vendor&q=... → { items }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const items = await db.contact.findMany({
      where: {
        ...(type ? { OR: [{ type }, { type: "both" }] } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { company: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/contacts failed:", e);
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

// POST /api/contacts → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await db.contact.create({
      data: {
        name: body.name.trim(),
        email: body.email || null,
        phone: body.phone || null,
        type: ["customer", "vendor", "both"].includes(body.type) ? body.type : "customer",
        company: body.company || null,
        city: body.city || null,
        country: body.country || null,
        vat: body.vat || null,
        isCompany: Boolean(body.isCompany),
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/contacts failed:", e);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
