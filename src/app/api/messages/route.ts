import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/messages?channel=general → { items } (oldest first, last 100)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "general";

    const items = await db.message.findMany({
      where: { channel },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/messages failed:", e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/messages → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.author || typeof body.author !== "string" || !body.author.trim()) {
      return NextResponse.json({ error: "Author is required" }, { status: 400 });
    }
    if (!body?.content || typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    const item = await db.message.create({
      data: {
        channel: body.channel || "general",
        author: body.author.trim(),
        content: body.content.trim(),
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/messages failed:", e);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
