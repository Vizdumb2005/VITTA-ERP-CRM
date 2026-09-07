import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/sales/:id → { item } — if body.lines is an array, lines are fully replaced
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.customerId !== undefined) data.customerId = body.customerId;
    if (body.status !== undefined && ["quotation", "sent", "sale", "done", "cancel"].includes(body.status))
      data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.date !== undefined && body.date) data.date = new Date(body.date);

    const lines = Array.isArray(body.lines)
      ? body.lines.map((l: { description?: unknown; qty?: unknown; price?: unknown }) => ({
          description: String(l?.description ?? "").trim(),
          qty: Number(l?.qty || 1),
          price: Number(l?.price || 0),
        }))
      : null;

    const updated = await db.$transaction(async (tx) => {
      await tx.saleOrder.update({ where: { id }, data });
      if (lines) {
        await tx.saleOrderLine.deleteMany({ where: { orderId: id } });
        if (lines.length) {
          await tx.saleOrderLine.createMany({ data: lines.map((l) => ({ ...l, orderId: id })) });
        }
      }
      return tx.saleOrder.findUnique({
        where: { id },
        include: { customer: { select: { name: true } }, lines: true },
      });
    });

    if (!updated) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    const item = {
      ...updated,
      customerName: updated.customer?.name ?? null,
      total: updated.lines.reduce((s, l) => s + l.qty * l.price, 0),
    };
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/sales/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update sales order" }, { status: 500 });
  }
}

// DELETE /api/sales/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.saleOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/sales/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete sales order" }, { status: 500 });
  }
}
