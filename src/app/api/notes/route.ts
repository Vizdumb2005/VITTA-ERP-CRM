import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notes?q=... → { items } (pinned first, then most recently updated)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;

    const items = await db.note.findMany({
      where: {
        ...(q ? { OR: [{ title: { contains: q } }, { content: { contains: q } }] } : {}),
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/notes failed:", e);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

// POST /api/notes → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const item = await db.note.create({
      data: {
        title: body.title.trim(),
        content: body.content ? String(body.content) : "",
        pinned: Boolean(body.pinned),
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/notes failed:", e);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
