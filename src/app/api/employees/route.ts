import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/employees?q=... → { items }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;

    const items = await db.employee.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { department: { contains: q } },
                { jobTitle: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/employees failed:", e);
    return NextResponse.json({ error: "Failed to load employees" }, { status: 500 });
  }
}

// POST /api/employees → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await db.employee.create({
      data: {
        name: body.name.trim(),
        email: body.email || null,
        phone: body.phone || null,
        jobTitle: body.jobTitle || null,
        department: body.department || null,
        salary: Number(body.salary || 0),
        hireDate: body.hireDate ? new Date(body.hireDate) : null,
        status: ["active", "on_leave", "departed"].includes(body.status) ? body.status : "active",
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/employees failed:", e);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
