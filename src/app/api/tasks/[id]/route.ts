import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PATCH /api/tasks/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.projectId !== undefined) data.projectId = body.projectId;
    if (body.stage !== undefined && ["todo", "in_progress", "review", "done"].includes(body.stage)) data.stage = body.stage;
    if (body.priority !== undefined) data.priority = Math.round(Number(body.priority || 0));
    if (body.assignee !== undefined) data.assignee = body.assignee || null;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const item = await db.task.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/tasks/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/tasks/:id failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
