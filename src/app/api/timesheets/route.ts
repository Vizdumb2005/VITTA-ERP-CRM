import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/timesheets?employeeId=&projectId=&q=... → { items } (employeeName + projectName flattened)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await db.timesheet.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(projectId ? { projectId } : {}),
        ...(q
          ? {
              OR: [
                { description: { contains: q } },
                { employee: { name: { contains: q } } },
                { project: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        employee: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });
    const items = rows.map((t) => ({
      ...t,
      employeeName: t.employee?.name ?? null,
      projectName: t.project?.name ?? null,
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/timesheets failed:", e);
    return NextResponse.json({ error: "Failed to load timesheets" }, { status: 500 });
  }
}

// POST /api/timesheets → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.employeeId || typeof body.employeeId !== "string") {
      return NextResponse.json({ error: "Employee is required" }, { status: 400 });
    }
    const item = await db.timesheet.create({
      data: {
        employeeId: body.employeeId,
        projectId: body.projectId || null,
        ...(body.date ? { date: new Date(body.date) } : {}),
        hours: Number(body.hours || 0),
        description: body.description || null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/timesheets failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create timesheet entry" }, { status: 500 });
  }
}
