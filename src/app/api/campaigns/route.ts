import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/campaigns?q=... → { items }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;

    const items = await db.campaign.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q } }, { subject: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/campaigns failed:", e);
    return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 });
  }
}

// POST /api/campaigns → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await db.campaign.create({
      data: {
        name: body.name.trim(),
        subject: body.subject || null,
        status: ["draft", "sent"].includes(body.status) ? body.status : "draft",
        recipients: Math.round(Number(body.recipients || 0)),
        opens: Math.round(Number(body.opens || 0)),
        clicks: Math.round(Number(body.clicks || 0)),
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/campaigns failed:", e);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
