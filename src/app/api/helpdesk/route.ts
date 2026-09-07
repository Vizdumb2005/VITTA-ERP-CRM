import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/helpdesk?category=&stage=&priority=&q=... → { items } (customerName flattened)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const stage = searchParams.get("stage") ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await db.helpdeskTicket.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(stage ? { stage } : {}),
        ...(priority ? { priority } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { assignee: { contains: q } },
                { description: { contains: q } },
                { customer: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const items = rows.map((t) => ({ ...t, customerName: t.customer?.name ?? null }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/helpdesk failed:", e);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

// POST /api/helpdesk → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const item = await db.helpdeskTicket.create({
      data: {
        title: body.title.trim(),
        category: ["helpdesk", "field"].includes(body.category) ? body.category : "helpdesk",
        customerId: body.customerId || null,
        stage: ["new", "in_progress", "on_hold", "resolved", "cancelled"].includes(body.stage) ? body.stage : "new",
        priority: ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium",
        assignee: body.assignee || null,
        description: body.description || null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/helpdesk failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
