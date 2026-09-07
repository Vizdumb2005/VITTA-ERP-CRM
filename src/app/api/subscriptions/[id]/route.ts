import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/subscriptions/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.plan !== undefined && ["starter", "gold", "enterprise"].includes(body.plan)) data.plan = body.plan;
    if (body.amount !== undefined) data.amount = Number(body.amount || 0);
    if (body.status !== undefined && ["active", "paused", "churned"].includes(body.status)) data.status = body.status;
    if (body.renewalDate !== undefined) data.renewalDate = body.renewalDate ? new Date(body.renewalDate) : null;
    if (body.customerId !== undefined) data.customerId = body.customerId || null;

    const item = await db.subscription.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/subscriptions/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

// DELETE /api/subscriptions/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.subscription.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/subscriptions/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
