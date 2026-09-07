import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/contacts/:id → { item }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.email !== undefined) data.email = body.email || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.type !== undefined && ["customer", "vendor", "both"].includes(body.type)) data.type = body.type;
    if (body.company !== undefined) data.company = body.company || null;
    if (body.city !== undefined) data.city = body.city || null;
    if (body.country !== undefined) data.country = body.country || null;
    if (body.vat !== undefined) data.vat = body.vat || null;
    if (body.isCompany !== undefined) data.isCompany = Boolean(body.isCompany);

    const item = await db.contact.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/contacts/:id failed:", e);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

// DELETE /api/contacts/:id → { ok: true }
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.contact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/contacts/:id failed:", e);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
