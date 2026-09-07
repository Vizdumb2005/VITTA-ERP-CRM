import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/leads?stage=&q=... → { items } (contactName flattened)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await db.lead.findMany({
      where: {
        ...(stage ? { stage } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { company: { contains: q } },
                { contactName: { contains: q } },
              ],
            }
          : {}),
      },
      include: { contact: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const items = rows.map((l) => ({ ...l, contactName: l.contact?.name ?? null }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/leads failed:", e);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}

// POST /api/leads → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await db.lead.create({
      data: {
        name: body.name.trim(),
        contactName: body.contactName || null,
        company: body.company || null,
        email: body.email || null,
        phone: body.phone || null,
        expectedRevenue: Number(body.expectedRevenue || 0),
        stage: ["new", "qualified", "proposition", "negotiation", "won", "lost"].includes(body.stage)
          ? body.stage
          : "new",
        priority: Math.round(Number(body.priority || 0)),
        source: body.source || null,
        ownerName: body.ownerName || null,
        notes: body.notes || null,
        contactId: body.contactId || null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/leads failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
