import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/invoices?type=&status=&q=... → { items } (contactName + total flattened, lines included)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const invoices = await db.invoice.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { number: { contains: q } },
                { notes: { contains: q } },
                { contact: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { contact: { select: { name: true } }, lines: true },
      orderBy: { date: "desc" },
    });
    const items = invoices.map((i) => ({
      ...i,
      contactName: i.contact?.name ?? null,
      total: i.lines.reduce((s, l) => s + l.qty * l.price, 0),
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/invoices failed:", e);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}

// POST /api/invoices → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.contactId || typeof body.contactId !== "string") {
      return NextResponse.json({ error: "Contact is required" }, { status: 400 });
    }
    const count = await db.invoice.count();
    const number = body.number ? String(body.number).trim() : `INV/2025/${String(count + 1).padStart(4, "0")}`;
    const lines = Array.isArray(body.lines)
      ? body.lines.map((l: { description?: unknown; qty?: unknown; price?: unknown }) => ({
          description: String(l?.description ?? "").trim(),
          qty: Number(l?.qty || 1),
          price: Number(l?.price || 0),
        }))
      : [];

    const item = await db.invoice.create({
      data: {
        number,
        type: ["customer", "vendor"].includes(body.type) ? body.type : "customer",
        contactId: body.contactId,
        ...(body.date ? { date: new Date(body.date) } : {}),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: ["draft", "posted", "paid"].includes(body.status) ? body.status : "draft",
        notes: body.notes || null,
        ...(lines.length ? { lines: { create: lines } } : {}),
      },
      include: { contact: { select: { name: true } }, lines: true },
    });
    return NextResponse.json(
      {
        item: {
          ...item,
          contactName: item.contact?.name ?? null,
          total: item.lines.reduce((s, l) => s + l.qty * l.price, 0),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/invoices failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return NextResponse.json({ error: "Number already exists" }, { status: 400 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
