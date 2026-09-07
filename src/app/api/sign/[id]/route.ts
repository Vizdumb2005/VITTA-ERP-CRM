import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/sign/:id → { item }
// Rule: when status becomes "signed" and signedAt is not provided → signedAt = now.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await db.signDoc.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.signer !== undefined) data.signer = String(body.signer).trim();
    if (body.status !== undefined && ["to_sign", "signed"].includes(body.status)) data.status = body.status;
    if (body.requestedAt !== undefined && body.requestedAt) data.requestedAt = new Date(body.requestedAt);
    if (body.signedAt !== undefined) data.signedAt = body.signedAt ? new Date(body.signedAt) : null;

    if (body.status === "signed" && existing.status !== "signed" && body.signedAt === undefined) {
      data.signedAt = new Date();
    }

    const item = await db.signDoc.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/sign/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update sign document" }, { status: 500 });
  }
}

// DELETE /api/sign/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.signDoc.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/sign/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete sign document" }, { status: 500 });
  }
}
