import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/tasks?projectId=&stage=&assignee=&q=... → { items } (projectName/projectColor flattened)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const stage = searchParams.get("stage") ?? undefined;
    const assignee = searchParams.get("assignee") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await db.task.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(stage ? { stage } : {}),
        ...(assignee ? { assignee } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { assignee: { contains: q } },
                { project: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { project: { select: { name: true, color: true } } },
      orderBy: { createdAt: "desc" },
    });
    const items = rows.map((t) => ({
      ...t,
      projectName: t.project?.name ?? null,
      projectColor: t.project?.color ?? null,
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/tasks failed:", e);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

// POST /api/tasks → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body?.projectId || typeof body.projectId !== "string") {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }
    const item = await db.task.create({
      data: {
        title: body.title.trim(),
        projectId: body.projectId,
        stage: ["todo", "in_progress", "review", "done"].includes(body.stage) ? body.stage : "todo",
        priority: Math.round(Number(body.priority || 0)),
        assignee: body.assignee || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/tasks failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
