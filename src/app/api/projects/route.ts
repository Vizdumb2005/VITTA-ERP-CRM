import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects?status=&q=... → { items }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const items = await db.project.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? { OR: [{ name: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/projects failed:", e);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

// POST /api/projects → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await db.project.create({
      data: {
        name: body.name.trim(),
        color: body.color || "#714B67",
        status: ["active", "done", "archived"].includes(body.status) ? body.status : "active",
        deadline: body.deadline ? new Date(body.deadline) : null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/projects failed:", e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
