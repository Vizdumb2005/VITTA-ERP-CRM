import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/employees/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.email !== undefined) data.email = body.email || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.jobTitle !== undefined) data.jobTitle = body.jobTitle || null;
    if (body.department !== undefined) data.department = body.department || null;
    if (body.salary !== undefined) data.salary = Number(body.salary || 0);
    if (body.hireDate !== undefined) data.hireDate = body.hireDate ? new Date(body.hireDate) : null;
    if (body.status !== undefined && ["active", "on_leave", "departed"].includes(body.status)) data.status = body.status;

    const item = await db.employee.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/employees/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

// DELETE /api/employees/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/employees/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
