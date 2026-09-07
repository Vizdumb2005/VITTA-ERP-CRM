import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/documents?q=... → { items }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;

    const items = await db.docFile.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { folder: { contains: q } },
                { owner: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/documents failed:", e);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// POST /api/documents → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await db.docFile.create({
      data: {
        name: body.name.trim(),
        kind: ["pdf", "sheet", "doc", "image", "folder", "link"].includes(body.kind) ? body.kind : "pdf",
        sizeKb: Math.round(Number(body.sizeKb || 0)),
        owner: body.owner || "Aarav Mehta",
        folder: body.folder || "General",
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/documents failed:", e);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
