import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  try {
    const [
      customerInvoices,
      saleOrders,
      leads,
      employees,
      projects,
      tickets,
      products,
      posOrders,
      recentLeads,
      recentSales,
      recentInvoices,
      recentTickets,
    ] = await Promise.all([
      db.invoice.findMany({ where: { type: "customer" }, include: { lines: true } }),
      db.saleOrder.findMany({ where: { status: { in: ["sale", "done"] } }, include: { lines: true } }),
      db.lead.findMany(),
      db.employee.findMany(),
      db.project.findMany({ where: { status: "active" } }),
      db.helpdeskTicket.findMany(),
      db.product.findMany(),
      db.posOrder.findMany({ where: { createdAt: { gte: startOfDay(new Date()) } } }),
      db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
      db.saleOrder.findMany({ orderBy: { date: "desc" }, take: 3, include: { customer: { select: { name: true } } } }),
      db.invoice.findMany({ orderBy: { date: "desc" }, take: 3, include: { contact: { select: { name: true } } } }),
      db.helpdeskTicket.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    ]);

    const invTotal = (inv: { lines: { qty: number; price: number }[] }) =>
      inv.lines.reduce((a, l) => a + l.qty * l.price, 0);

    const paidRevenue = customerInvoices.filter((i) => i.status === "paid").reduce((a, i) => a + invTotal(i), 0);
    const receivables = customerInvoices.filter((i) => i.status === "posted").reduce((a, i) => a + invTotal(i), 0);
    const now = new Date();
    const overdue = customerInvoices
      .filter((i) => i.status === "posted" && i.dueDate && i.dueDate < now)
      .reduce((a, i) => a + invTotal(i), 0);

    const quotations = saleOrders.length; // placeholder replaced below
    void quotations;
    const allSales = await db.saleOrder.findMany({ include: { lines: true } });
    const openQuotations = allSales.filter((s) => s.status === "quotation" || s.status === "sent");
    const quotationValue = openQuotations.reduce(
      (a, s) => a + s.lines.reduce((x, l) => x + l.qty * l.price, 0),
      0
    );
    const bookedRevenue = allSales
      .filter((s) => s.status === "sale" || s.status === "done")
      .reduce((a, s) => a + s.lines.reduce((x, l) => x + l.qty * l.price, 0), 0);

    const openLeads = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
    const openLeadValue = openLeads.reduce((a, l) => a + l.expectedRevenue, 0);
    const wonValue = leads.filter((l) => l.stage === "won").reduce((a, l) => a + l.expectedRevenue, 0);

    const leadStages = ["new", "qualified", "proposition", "negotiation", "won", "lost"] as const;
    const leadsByStage = leadStages.map((stage) => {
      const inStage = leads.filter((l) => l.stage === stage);
      return { stage, count: inStage.length, value: inStage.reduce((a, l) => a + l.expectedRevenue, 0) };
    });

    // Sales by month, last 6 months
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${dt.getFullYear()}-${dt.getMonth()}`,
        label: dt.toLocaleDateString("en-IN", { month: "short" }),
        total: 0,
      });
    }
    for (const s of allSales) {
      if (s.status !== "sale" && s.status !== "done") continue;
      const dt = new Date(s.date);
      const bucket = months.find((m) => m.key === `${dt.getFullYear()}-${dt.getMonth()}`);
      if (bucket) bucket.total += s.lines.reduce((x, l) => x + l.qty * l.price, 0);
    }

    const lowStock = products
      .filter((p) => p.type === "goods" && p.qty <= 10)
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 6)
      .map((p) => ({ name: p.name, sku: p.sku, qty: p.qty }));

    const recentActivity = [
      ...recentLeads.map((l) => ({
        type: "lead",
        label: l.name,
        sub: `CRM lead — ${l.company ?? "Unknown"}`,
        at: l.createdAt,
      })),
      ...recentSales.map((s) => ({
        type: "sale",
        label: s.number,
        sub: `Sales order — ${s.customer.name}`,
        at: s.date.toISOString(),
      })),
      ...recentInvoices.map((i) => ({
        type: "invoice",
        label: i.number,
        sub: `Invoice — ${i.contact.name}`,
        at: i.date.toISOString(),
      })),
      ...recentTickets.map((t) => ({
        type: "ticket",
        label: t.title,
        sub: `Ticket — ${t.priority} priority`,
        at: t.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);

    const posTodayTotal = posOrders.reduce((a, o) => a + o.total, 0);

    return NextResponse.json({
      stats: {
        paidRevenue,
        receivables,
        overdue,
        bookedRevenue,
        openQuotations: openQuotations.length,
        quotationValue,
        openLeads: openLeads.length,
        openLeadValue,
        wonValue,
        headcount: employees.filter((e) => e.status === "active").length,
        onLeaveCount: employees.filter((e) => e.status === "on_leave").length,
        activeProjects: projects.length,
        openTickets: tickets.filter((t) => t.stage === "new" || t.stage === "in_progress").length,
        lowStockCount: products.filter((p) => p.type === "goods" && p.qty > 0 && p.qty <= 10).length,
        outOfStockCount: products.filter((p) => p.type === "goods" && p.qty === 0).length,
        posTodayCount: posOrders.length,
        posTodayTotal,
      },
      leadsByStage,
      salesByMonth: months.map(({ label, total }) => ({ label, total })),
      recentActivity,
      lowStock,
    });
  } catch (e) {
    console.error("GET /api/dashboard failed:", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
