import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/sign?q=... → { items }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;

    const items = await db.signDoc.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q } }, { signer: { contains: q } }] } : {}),
      },
      orderBy: { requestedAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/sign failed:", e);
    return NextResponse.json({ error: "Failed to load sign documents" }, { status: 500 });
  }
}

// POST /api/sign → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body?.signer || typeof body.signer !== "string" || !body.signer.trim()) {
      return NextResponse.json({ error: "Signer is required" }, { status: 400 });
    }
    const status = ["to_sign", "signed"].includes(body.status) ? body.status : "to_sign";
    const item = await db.signDoc.create({
      data: {
        name: body.name.trim(),
        signer: body.signer.trim(),
        status,
        ...(body.requestedAt ? { requestedAt: new Date(body.requestedAt) } : {}),
        signedAt: body.signedAt ? new Date(body.signedAt) : status === "signed" ? new Date() : null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/sign failed:", e);
    return NextResponse.json({ error: "Failed to create sign document" }, { status: 500 });
  }
}
