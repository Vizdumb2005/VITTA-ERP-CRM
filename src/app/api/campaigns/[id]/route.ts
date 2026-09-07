import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/campaigns/:id → { item }
// Rule: when status transitions to "sent" and sentAt is not provided,
// stamp sentAt=now and simulate opens/clicks when none exist yet.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.subject !== undefined) data.subject = body.subject || null;
    if (body.status !== undefined && ["draft", "sent"].includes(body.status)) data.status = body.status;
    if (body.recipients !== undefined) data.recipients = Math.round(Number(body.recipients || 0));
    if (body.opens !== undefined) data.opens = Math.round(Number(body.opens || 0));
    if (body.clicks !== undefined) data.clicks = Math.round(Number(body.clicks || 0));
    if (body.sentAt !== undefined) data.sentAt = body.sentAt ? new Date(body.sentAt) : null;

    if (body.status === "sent" && existing.status !== "sent" && body.sentAt === undefined) {
      data.sentAt = new Date();
      const recipients =
        body.recipients !== undefined ? Math.round(Number(body.recipients || 0)) : existing.recipients;
      const opens = body.opens !== undefined ? Math.round(Number(body.opens || 0)) : existing.opens;
      if (opens === 0 && recipients > 0) {
        const simulated = Math.round(recipients * (0.38 + Math.random() * 0.15));
        data.opens = simulated;
        data.clicks = Math.round(simulated * 0.16);
      }
    }

    const item = await db.campaign.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/campaigns/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE /api/campaigns/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/campaigns/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
