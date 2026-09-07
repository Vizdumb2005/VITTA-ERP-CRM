import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/leaves/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.employeeId !== undefined) data.employeeId = body.employeeId;
    if (body.type !== undefined && ["casual", "sick", "earned", "unpaid"].includes(body.type)) data.type = body.type;
    if (body.from !== undefined && body.from) data.from = new Date(body.from);
    if (body.to !== undefined && body.to) data.to = new Date(body.to);
    if (body.days !== undefined) data.days = Number(body.days || 1);
    if (body.status !== undefined && ["pending", "approved", "refused"].includes(body.status)) data.status = body.status;
    if (body.reason !== undefined) data.reason = body.reason || null;

    const item = await db.leaveRequest.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/leaves/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}

// DELETE /api/leaves/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.leaveRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/leaves/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete leave request" }, { status: 500 });
  }
}
