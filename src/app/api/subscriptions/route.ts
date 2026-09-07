import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/subscriptions?status=&plan=&q=... → { items } (customerName flattened)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const plan = searchParams.get("plan") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await db.subscription.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(plan ? { plan } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { plan: { contains: q } },
                { customer: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const items = rows.map((s) => ({ ...s, customerName: s.customer?.name ?? null }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/subscriptions failed:", e);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}

// POST /api/subscriptions → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await db.subscription.create({
      data: {
        name: body.name.trim(),
        plan: ["starter", "gold", "enterprise"].includes(body.plan) ? body.plan : "starter",
        amount: Number(body.amount || 0),
        status: ["active", "paused", "churned"].includes(body.status) ? body.status : "active",
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
        customerId: body.customerId || null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/subscriptions failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
