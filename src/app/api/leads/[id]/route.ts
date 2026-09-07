import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/leads/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.contactName !== undefined) data.contactName = body.contactName || null;
    if (body.company !== undefined) data.company = body.company || null;
    if (body.email !== undefined) data.email = body.email || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.expectedRevenue !== undefined) data.expectedRevenue = Number(body.expectedRevenue || 0);
    if (body.stage !== undefined && ["new", "qualified", "proposition", "negotiation", "won", "lost"].includes(body.stage))
      data.stage = body.stage;
    if (body.priority !== undefined) data.priority = Math.round(Number(body.priority || 0));
    if (body.source !== undefined) data.source = body.source || null;
    if (body.ownerName !== undefined) data.ownerName = body.ownerName || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.contactId !== undefined) data.contactId = body.contactId || null;

    const item = await db.lead.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/leads/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

// DELETE /api/leads/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/leads/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
