import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/pos/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.total !== undefined) data.total = Number(body.total || 0);
    if (body.itemsCount !== undefined) data.itemsCount = Math.round(Number(body.itemsCount || 0));
    if (body.items !== undefined)
      data.items = Array.isArray(body.items)
        ? JSON.stringify(body.items)
        : typeof body.items === "string" && body.items.trim()
          ? body.items
          : "[]";
    if (body.paymentMethod !== undefined && ["cash", "card", "upi"].includes(body.paymentMethod))
      data.paymentMethod = body.paymentMethod;
    if (body.cashier !== undefined) data.cashier = body.cashier || "Aarav Mehta";

    const item = await db.posOrder.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/pos/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update POS order" }, { status: 500 });
  }
}

// DELETE /api/pos/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.posOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/pos/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete POS order" }, { status: 500 });
  }
}
