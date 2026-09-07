import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/invoices/:id → { item } — if body.lines is an array, lines are fully replaced
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.type !== undefined && ["customer", "vendor"].includes(body.type)) data.type = body.type;
    if (body.contactId !== undefined) data.contactId = body.contactId;
    if (body.date !== undefined && body.date) data.date = new Date(body.date);
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.status !== undefined && ["draft", "posted", "paid"].includes(body.status)) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const lines = Array.isArray(body.lines)
      ? body.lines.map((l: { description?: unknown; qty?: unknown; price?: unknown }) => ({
          description: String(l?.description ?? "").trim(),
          qty: Number(l?.qty || 1),
          price: Number(l?.price || 0),
        }))
      : null;

    const updated = await db.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id }, data });
      if (lines) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
        if (lines.length) {
          await tx.invoiceLine.createMany({ data: lines.map((l) => ({ ...l, invoiceId: id })) });
        }
      }
      return tx.invoice.findUnique({
        where: { id },
        include: { contact: { select: { name: true } }, lines: true },
      });
    });

    if (!updated) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    const item = {
      ...updated,
      contactName: updated.contact?.name ?? null,
      total: updated.lines.reduce((s, l) => s + l.qty * l.price, 0),
    };
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/invoices/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE /api/invoices/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/invoices/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
