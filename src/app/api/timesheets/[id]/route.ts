import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/timesheets/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.employeeId !== undefined) data.employeeId = body.employeeId;
    if (body.projectId !== undefined) data.projectId = body.projectId || null;
    if (body.date !== undefined && body.date) data.date = new Date(body.date);
    if (body.hours !== undefined) data.hours = Number(body.hours || 0);
    if (body.description !== undefined) data.description = body.description || null;

    const item = await db.timesheet.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/timesheets/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update timesheet entry" }, { status: 500 });
  }
}

// DELETE /api/timesheets/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.timesheet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/timesheets/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete timesheet entry" }, { status: 500 });
  }
}
