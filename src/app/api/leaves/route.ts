import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// GET /api/leaves?employeeId=&status=&q= → { items } (employeeName flattened)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await db.leaveRequest.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { reason: { contains: q } },
                { type: { contains: q } },
                { employee: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { employee: { select: { name: true } } },
      orderBy: { from: "desc" },
    });
    const items = rows.map((l) => ({ ...l, employeeName: l.employee?.name ?? null }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/leaves failed:", e);
    return NextResponse.json({ error: "Failed to load leave requests" }, { status: 500 });
  }
}

// POST /api/leaves → { item }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.employeeId || typeof body.employeeId !== "string") {
      return NextResponse.json({ error: "Employee is required" }, { status: 400 });
    }
    if (!body?.from || !body?.to) {
      return NextResponse.json({ error: "From and to dates are required" }, { status: 400 });
    }
    const item = await db.leaveRequest.create({
      data: {
        employeeId: body.employeeId,
        type: ["casual", "sick", "earned", "unpaid"].includes(body.type) ? body.type : "casual",
        from: new Date(body.from),
        to: new Date(body.to),
        days: Number(body.days || 1),
        status: ["pending", "approved", "refused"].includes(body.status) ? body.status : "pending",
        reason: body.reason || null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST /api/leaves failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}
