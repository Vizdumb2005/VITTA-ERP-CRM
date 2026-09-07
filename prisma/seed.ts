/* VITTA ERP — demo seed. Run: bun prisma/seed.ts */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const d = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400000);
const pick = <T>(arr: readonly T[], i: number) => arr[i % arr.length]!;

async function main() {
  console.log("Seeding VITTA demo data...");

  await db.message.deleteMany();
  await db.signDoc.deleteMany();
  await db.docFile.deleteMany();
  await db.note.deleteMany();
  await db.posOrder.deleteMany();
  await db.campaign.deleteMany();
  await db.subscription.deleteMany();
  await db.manufacturingOrder.deleteMany();
  await db.helpdeskTicket.deleteMany();
  await db.timesheet.deleteMany();
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.invoiceLine.deleteMany();
  await db.invoice.deleteMany();
  await db.purchaseOrderLine.deleteMany();
  await db.purchaseOrder.deleteMany();
  await db.saleOrderLine.deleteMany();
  await db.saleOrder.deleteMany();
  await db.lead.deleteMany();
  await db.product.deleteMany();
  await db.leaveRequest.deleteMany();
  await db.employee.deleteMany();
  await db.contact.deleteMany();

  // ── Contacts ──────────────────────────────────────────────
  const customerData = [
    ["Priya Sharma", "priya@zenithretail.in", "+91 98200 11223", "Zenith Retail Pvt Ltd", "Mumbai", true],
    ["Rahul Verma", "rahul@bluemountain.co.in", "+91 98450 33445", "Blue Mountain Traders", "Bengaluru", true],
    ["Ananya Iyer", "ananya@spiceroutemart.com", "+91 99620 55667", "Spice Route Mart", "Chennai", true],
    ["Karan Malhotra", "karan@northstarlogistics.in", "+91 98110 77889", "Northstar Logistics", "Delhi", true],
    ["Meera Nair", "meera@keralagreenworks.org", "+91 98470 99001", "Kerala Green Works", "Kochi", false],
    ["Vikram Singh", "vikram@punjabagro.com", "+91 98760 22334", "Punjab Agro Foods", "Ludhiana", true],
    ["Sneha Kulkarni", "sneha@deccandigital.in", "+91 90280 44556", "Deccan Digital Solutions", "Pune", true],
    ["Arjun Patel", "arjun@gujarattextiles.co", "+91 97250 66778", "Gujarat Textiles Ltd", "Ahmedabad", true],
    ["Divya Rao", "divya@msmediclinic.in", "+91 96860 88990", "MSM Mediclinic", "Hyderabad", false],
    ["Rohan Das", "rohan@bengalhandloom.in", "+91 98300 12345", "Bengal Handloom Co-op", "Kolkata", true],
    ["Aditya Rao", "aditya.personal@gmail.com", "+91 99001 23456", "", "Manipal", false],
    ["Ishita Bose", "ishita@craftsbazaar.in", "+91 98311 34567", "Crafts Bazaar Online", "Kolkata", true],
  ] as const;
  const customers: { id: string }[] = [];
  for (const [name, email, phone, company, city, isCompany] of customerData) {
    customers.push(
      await db.contact.create({
        data: { name, email, phone, company: company || null, city, isCompany, type: "customer", country: "India" },
      })
    );
  }

  const vendorData = [
    ["Sunrise Components", "sales@sunrisecomponents.in", "+91 80 2233 4455", "Peenya, Bengaluru"],
    ["Global Steel Works", "orders@globalsteelworks.com", "+91 22 6677 8899", "Mumbai"],
    ["Shree Packaging Ltd", "hello@shreepackaging.in", "+91 79 4455 6677", "Ahmedabad"],
    ["TechSource India", "sales@techsource.in", "+91 40 1122 3344", "Hyderabad"],
    ["Ocean Freight Co", "ops@oceanfreight.co", "+91 44 5566 7788", "Chennai"],
    ["Paper & Ink Supplies", "supply@paperink.in", "+91 33 2244 5566", "Kolkata"],
  ] as const;
  const vendors: { id: string }[] = [];
  for (const [name, email, phone, city] of vendorData) {
    vendors.push(
      await db.contact.create({
        data: { name, email, phone, city, isCompany: true, type: "vendor", country: "India" },
      })
    );
  }

  // ── Employees ─────────────────────────────────────────────
  const empData = [
    ["Aarav Mehta", "aarav@vitta.in", "Administrator", "Management", 180000, -900, "active"],
    ["Nisha Fernandes", "nisha@vitta.in", "Sales Manager", "Sales", 95000, -720, "active"],
    ["Ravi Kulkarni", "ravi@vitta.in", "Senior Accountant", "Finance", 72000, -600, "active"],
    ["Pooja Reddy", "pooja@vitta.in", "HR Executive", "Human Resources", 58000, -400, "active"],
    ["Sameer Khan", "sameer@vitta.in", "Warehouse Manager", "Operations", 65000, -520, "active"],
    ["Tanvi Joshi", "tanvi@vitta.in", "Support Lead", "Customer Support", 52000, -350, "active"],
    ["Imran Shaikh", "imran@vitta.in", "Production Supervisor", "Manufacturing", 60000, -480, "active"],
    ["Kavya Menon", "kavya@vitta.in", "Marketing Specialist", "Marketing", 56000, -260, "on_leave"],
    ["Dev Anand", "dev@vitta.in", "Service Technician", "Field Service", 44000, -180, "active"],
    ["Lakshmi Pillai", "lakshmi@vitta.in", "Purchase Officer", "Procurement", 54000, -150, "active"],
  ] as const;
  const employees: { id: string; name: string }[] = [];
  for (const [name, email, jobTitle, department, salary, hire, status] of empData) {
    employees.push(
      await db.employee.create({
        data: { name, email, jobTitle, department, salary, hireDate: d(hire), status },
      })
    );
  }

  // ── Leaves ────────────────────────────────────────────────
  await db.leaveRequest.createMany({
    data: [
      { employeeId: employees[7]!.id, type: "sick", from: d(-2), to: d(3), days: 5, status: "approved", reason: "Viral fever recovery" },
      { employeeId: employees[3]!.id, type: "casual", from: d(7), to: d(8), days: 2, status: "pending", reason: "Family function" },
      { employeeId: employees[5]!.id, type: "earned", from: d(14), to: d(21), days: 7, status: "pending", reason: "Annual vacation" },
      { employeeId: employees[8]!.id, type: "casual", from: d(-10), to: d(-10), days: 1, status: "approved", reason: "Personal errand" },
      { employeeId: employees[2]!.id, type: "unpaid", from: d(30), to: d(44), days: 15, status: "refused", reason: "Long leave without notice" },
    ],
  });

  // ── Products ──────────────────────────────────────────────
  const prodData = [
    ["VITTA Laptop Pro 14\"", "LP-PRO14", "Electronics", 89990, 72000, 34, "Units"],
    ["Wireless Mouse Slim", "MO-WSL01", "Electronics", 1299, 640, 180, "Units"],
    ["Mechanical Keyboard K2", "KB-K2W", "Electronics", 4499, 2900, 95, "Units"],
    ["USB-C Docking Station", "DK-USBC11", "Electronics", 7499, 5100, 48, "Units"],
    ["Ergonomic Office Chair", "CH-ERGO7", "Furniture", 14999, 9800, 22, "Units"],
    ["Standing Desk 120cm", "DK-STD120", "Furniture", 24999, 17500, 12, "Units"],
    ["A4 Copier Paper Ream", "PP-A4R5", "Stationery", 349, 240, 420, "Reams"],
    ["Toner Cartridge Black", "TN-BK72", "Stationery", 2199, 1500, 8, "Units"],
    ["Packaging Box Large", "BX-LRG01", "Packaging", 89, 48, 1500, "Units"],
    ["Bubble Wrap Roll 50m", "BW-RL50", "Packaging", 699, 430, 140, "Rolls"],
    ["Steel Shelf Unit", "SH-STL06", "Warehouse", 8999, 6200, 5, "Units"],
    ["Barcode Scanner 2D", "SC-2DPR3", "Electronics", 5499, 3800, 0, "Units"],
    ["VITTA Implementation Service", "SV-IMPL", "Services", 150000, 0, 0, "Hours"],
    ["Annual Support Contract", "SV-SUP24", "Services", 48000, 0, 0, "Contracts"],
  ] as const;
  const products: { id: string; name: string; price: number }[] = [];
  for (const [name, sku, category, price, cost, qty, unit] of prodData) {
    products.push(
      await db.product.create({
        data: {
          name, sku, category, price, cost, qty, unit,
          type: name.includes("Service") || name.includes("Contract") ? "service" : "goods",
        },
      })
    );
  }

  // ── Leads ─────────────────────────────────────────────────
  const leadData: [string, string, number, string, number, string][] = [
    ["ERP migration for retail chain", "Zenith Retail Pvt Ltd", 850000, "won", 3, "campaign"],
    ["POS rollout — 40 stores", "Spice Route Mart", 620000, "negotiation", 2, "partner"],
    ["Inventory automation", "Blue Mountain Traders", 310000, "proposition", 2, "website"],
    ["Annual support contract", "Deccan Digital Solutions", 96000, "qualified", 1, "referral"],
    ["HRMS implementation", "Gujarat Textiles Ltd", 275000, "proposition", 1, "campaign"],
    ["Warehouse barcode system", "Northstar Logistics", 190000, "new", 1, "website"],
    ["eCommerce website build", "Crafts Bazaar Online", 240000, "qualified", 2, "referral"],
    ["Accounting module training", "Kerala Green Works", 45000, "new", 0, "walk_in"],
    ["CRM consolidation project", "MSM Mediclinic", 130000, "negotiation", 2, "campaign"],
    ["Manufacturing MRP pilot", "Bengal Handloom Co-op", 380000, "proposition", 2, "partner"],
    ["Subscription billing setup", "Punjab Agro Foods", 150000, "qualified", 1, "website"],
    ["Website revamp enquiry", "Aditya Rao", 80000, "lost", 0, "website"],
    ["POS hardware bundle", "Crafts Bazaar Online", 120000, "won", 1, "referral"],
    ["Field service app demo", "Zenith Retail Pvt Ltd", 60000, "new", 0, "campaign"],
  ];
  const owners = ["Nisha Fernandes", "Aarav Mehta", "Lakshmi Pillai"];
  for (let i = 0; i < leadData.length; i++) {
    const [name, company, revenue, stage, priority, source] = leadData[i]!;
    await db.lead.create({
      data: {
        name, company, expectedRevenue: revenue, stage, priority, source,
        contactName: pick(customerData, i)[0] as string,
        email: pick(customerData, i)[1] as string,
        phone: pick(customerData, i)[2] as string,
        ownerName: pick(owners, i),
        createdAt: d(-3 * (leadData.length - i) - 2),
      },
    });
  }

  // ── Sale Orders ───────────────────────────────────────────
  const saleStatuses = ["done", "done", "sale", "sale", "quotation", "sent", "done", "sale", "quotation", "done", "cancel", "sale"];
  for (let i = 0; i < saleStatuses.length; i++) {
    const cust = pick(customers, i * 3);
    const lineCount = (i % 3) + 1;
    const lines: { description: string; qty: number; price: number }[] = [];
    for (let j = 0; j < lineCount; j++) {
      const p = pick(products, i + j * 4);
      lines.push({ description: p.name, qty: ((i + j) % 5) + 1, price: p.price });
    }
    const so = await db.saleOrder.create({
      data: {
        number: `SO${String(i + 1).padStart(4, "0")}`,
        customerId: cust.id,
        date: d(-6 * (saleStatuses.length - i)),
        status: saleStatuses[i]!,
        notes: i % 4 === 0 ? "Delivery in 2 batches as discussed." : null,
      },
    });
    for (const l of lines) await db.saleOrderLine.create({ data: { ...l, orderId: so.id } });
  }

  // ── Purchase Orders ───────────────────────────────────────
  const poStatuses = ["received", "confirmed", "rfq", "received", "confirmed", "rfq", "received", "cancel"];
  for (let i = 0; i < poStatuses.length; i++) {
    const vend = pick(vendors, i);
    const p = pick(products, i * 2 + 3);
    const po = await db.purchaseOrder.create({
      data: {
        number: `PO${String(i + 1).padStart(4, "0")}`,
        vendorId: vend.id,
        date: d(-9 * (poStatuses.length - i)),
        status: poStatuses[i]!,
      },
    });
    await db.purchaseOrderLine.create({
      data: { orderId: po.id, description: p.name, qty: ((i % 4) + 2) * 5, price: Math.round(p.price * 0.7) },
    });
  }

  // ── Invoices ──────────────────────────────────────────────
  const invStatuses = ["paid", "paid", "posted", "posted", "paid", "draft", "posted", "paid", "draft", "posted", "paid", "posted", "draft", "paid"];
  for (let i = 0; i < invStatuses.length; i++) {
    const isVendor = i % 4 === 3;
    const contact = isVendor ? pick(vendors, i) : pick(customers, i * 2);
    const p = pick(products, i * 3);
    const inv = await db.invoice.create({
      data: {
        number: `INV/2025/${String(i + 1).padStart(4, "0")}`,
        type: isVendor ? "vendor" : "customer",
        contactId: contact.id,
        date: d(-8 * (invStatuses.length - i)),
        dueDate: d(-8 * (invStatuses.length - i) + 21),
        status: invStatuses[i]!,
        notes: isVendor ? "Vendor bill — GST included" : null,
      },
    });
    await db.invoiceLine.create({
      data: { invoiceId: inv.id, description: p.name, qty: (i % 3) + 1, price: p.price },
    });
  }

  // ── Projects & Tasks ──────────────────────────────────────
  const projData: [string, string][] = [
    ["Zenith ERP Rollout", "#714B67"],
    ["Website Revamp 2025", "#00A88D"],
    ["POS Deployment — Spice Route", "#F8931D"],
    ["Warehouse Automation", "#31A3DD"],
    ["Internal — VITTA 3.1 Release", "#7C2D5E"],
    ["Customer Training Program", "#FBB04E"],
  ];
  const projects: { id: string }[] = [];
  for (const [name, color] of projData) {
    projects.push(await db.project.create({ data: { name, color, deadline: d(20 + Math.random() * 60) } }));
  }
  const taskData: [string, number, string, string, number][] = [
    ["Data migration dry run", 0, "in_progress", "Ravi Kulkarni", 1],
    ["Chart of accounts mapping", 0, "done", "Ravi Kulkarni", 0],
    ["UAT with retail ops team", 0, "review", "Nisha Fernandes", 1],
    ["Go-live checklist", 0, "todo", "Aarav Mehta", 0],
    ["Homepage hero redesign", 1, "in_progress", "Kavya Menon", 1],
    ["SEO meta template", 1, "todo", "Kavya Menon", 0],
    ["CMS content import", 1, "review", "Pooja Reddy", 0],
    ["Store 1-10 hardware install", 2, "done", "Dev Anand", 1],
    ["Cashier training session", 2, "in_progress", "Tanvi Joshi", 0],
    ["Configure loyalty pricing", 2, "todo", "Nisha Fernandes", 1],
    ["Barcode scanner setup", 3, "in_progress", "Sameer Khan", 1],
    ["Rack labeling v2", 3, "todo", "Sameer Khan", 0],
    ["Cycle count process doc", 3, "review", "Imran Shaikh", 0],
    ["Multi-language i18n audit", 4, "todo", "Dev Anand", 1],
    ["API rate limiting", 4, "in_progress", "Aarav Mehta", 1],
    ["Dashboard widget cache", 4, "done", "Aarav Mehta", 0],
    ["Fix chatter notification bug", 4, "review", "Aarav Mehta", 1],
    ["Onboarding video scripts", 5, "todo", "Tanvi Joshi", 0],
    ["Sandbox tenant template", 5, "in_progress", "Pooja Reddy", 0],
    ["Feedback survey draft", 5, "done", "Tanvi Joshi", 0],
    ["Vendor portal mockups", 4, "todo", "Lakshmi Pillai", 0],
    ["Regression test pass 1", 4, "todo", "Ravi Kulkarni", 1],
    ["Load test checkout flow", 4, "review", "Sameer Khan", 1],
    ["Accessibility audit fixes", 1, "todo", "Dev Anand", 1],
  ];
  for (let i = 0; i < taskData.length; i++) {
    const [title, projIdx, stage, assignee, priority] = taskData[i]!;
    await db.task.create({
      data: {
        title, projectId: projects[projIdx]!.id, stage, assignee, priority,
        dueDate: d(Math.floor(Math.random() * 20) - 5),
      },
    });
  }

  // ── Timesheets ────────────────────────────────────────────
  const tsDescriptions = [
    "Requirement gathering workshop", "Bug fixing & QA", "Customer call notes", "Data import scripts",
    "Training session delivery", "Warehouse process review", "Sprint planning", "Documentation updates",
  ];
  for (let i = 0; i < 36; i++) {
    const emp = pick(employees, i * 3);
    await db.timesheet.create({
      data: {
        employeeId: emp.id,
        projectId: pick(projects, i).id,
        date: d(-(i % 9) - 1),
        hours: [2, 3, 4, 5, 6, 7, 8][i % 7]!,
        description: pick(tsDescriptions, i),
      },
    });
  }

  // ── Helpdesk + Field service tickets ──────────────────────
  const ticketData: [string, string, string, string, string, string][] = [
    ["Invoice PDF not printing totals", "helpdesk", "new", "high", "Zenith Retail Pvt Ltd", "Ravi Kulkarni"],
    ["Cannot reset POS session", "helpdesk", "in_progress", "high", "Spice Route Mart", "Tanvi Joshi"],
    ["Add GST field on quote report", "helpdesk", "in_progress", "medium", "Deccan Digital Solutions", "Aarav Mehta"],
    ["Slow dashboard on mobile", "helpdesk", "on_hold", "low", "Blue Mountain Traders", "Dev Anand"],
    ["User locked out — password", "helpdesk", "resolved", "medium", "Punjab Agro Foods", "Pooja Reddy"],
    ["Export order history to Excel", "helpdesk", "new", "low", "Crafts Bazaar Online", "Tanvi Joshi"],
    ["Barcode printer misalignment", "helpdesk", "resolved", "medium", "Northstar Logistics", "Sameer Khan"],
    ["AC installation at warehouse", "field", "new", "medium", "Punjab Agro Foods", "Dev Anand"],
    ["Scanner recalibration visit", "field", "in_progress", "high", "Zenith Retail Pvt Ltd", "Dev Anand"],
    ["POS terminal hardware check", "field", "new", "medium", "Spice Route Mart", "Dev Anand"],
    ["Server room UPS service", "field", "resolved", "low", "Deccan Digital Solutions", "Imran Shaikh"],
    ["Network cabling — new store", "field", "in_progress", "high", "Crafts Bazaar Online", "Sameer Khan"],
  ];
  for (const [title, category, stage, priority, custName, assignee] of ticketData) {
    const cust = customers.find((c) => customerData.find((cd) => cd[0] && cd[3] === custName)?.[0]);
    await db.helpdeskTicket.create({
      data: {
        title, category, stage, priority, assignee,
        customerId: cust?.id ?? null,
        description: "Auto-generated from customer email.",
        createdAt: d(-Math.floor(Math.random() * 10) - 1),
      },
    });
  }

  // ── Manufacturing orders ──────────────────────────────────
  const moData: [number, number, string][] = [
    [4, 10, "confirmed"],
    [4, 6, "in_progress"],
    [9, 200, "done"],
    [8, 300, "confirmed"],
    [10, 4, "draft"],
    [3, 25, "in_progress"],
    [0, 5, "cancelled"],
  ];
  for (let i = 0; i < moData.length; i++) {
    const [pIdx, qty, status] = moData[i]!;
    await db.manufacturingOrder.create({
      data: {
        number: `MO${String(i + 1).padStart(4, "0")}`,
        productId: products[pIdx]!.id,
        qty,
        status,
        scheduledDate: d(-5 + i * 3),
        assignee: pick(employees, i * 2).name,
      },
    });
  }

  // ── Subscriptions ─────────────────────────────────────────
  const subData: [string, string, number, string, number][] = [
    ["Zenith Retail — Enterprise", "enterprise", 250000, "active", 12],
    ["Spice Route — Gold", "gold", 98000, "active", 5],
    ["Blue Mountain — Starter", "starter", 24000, "active", 18],
    ["Deccan Digital — Gold", "gold", 88000, "active", 9],
    ["Gujarat Textiles — Enterprise", "enterprise", 210000, "active", 3],
    ["Punjab Agro — Starter", "starter", 24000, "paused", 40],
    ["MSM Mediclinic — Starter", "starter", 24000, "churned", -15],
    ["Crafts Bazaar — Gold", "gold", 76000, "active", 21],
  ];
  for (let i = 0; i < subData.length; i++) {
    const [name, plan, amount, status, renewal] = subData[i]!;
    await db.subscription.create({
      data: {
        name, plan, amount, status,
        renewalDate: d(renewal),
        customerId: pick(customers, i * 2).id,
      },
    });
  }

  // ── Campaigns ─────────────────────────────────────────────
  await db.campaign.createMany({
    data: [
      { name: "VITTA 3.1 Launch", subject: "Meet the all-new VITTA 3.1", status: "sent", recipients: 5200, opens: 2680, clicks: 412, sentAt: d(-12) },
      { name: "Diwali Offer 2025", subject: "Festive savings on Enterprise plans", status: "sent", recipients: 4800, opens: 2210, clicks: 540, sentAt: d(-30) },
      { name: "Webinar: MRP in 30 mins", subject: "You're invited — Manufacturing masterclass", status: "sent", recipients: 1900, opens: 980, clicks: 260, sentAt: d(-6) },
      { name: "Q3 Newsletter", subject: "Quarterly product digest", status: "draft", recipients: 0, opens: 0, clicks: 0 },
      { name: "Win-back: lapsed trials", subject: "We kept your workspace warm", status: "draft", recipients: 0, opens: 0, clicks: 0 },
    ],
  });

  // ── POS orders ────────────────────────────────────────────
  const posData: [number, string][] = [
    [3, "upi"], [1, "cash"], [4, "card"], [2, "upi"], [1, "cash"], [5, "card"], [2, "upi"],
  ];
  for (let i = 0; i < posData.length; i++) {
    const [lineCount, method] = posData[i]!;
    let total = 0;
    const items: { name: string; qty: number; price: number }[] = [];
    for (let j = 0; j < lineCount + 1; j++) {
      const p = pick(products, i + j);
      const qty = ((i + j) % 3) + 1;
      total += qty * p.price;
      items.push({ name: p.name, qty, price: p.price });
    }
    await db.posOrder.create({
      data: {
        number: `POS${String(i + 1).padStart(4, "0")}`,
        total,
        itemsCount: items.reduce((a, it) => a + it.qty, 0),
        items: JSON.stringify(items),
        paymentMethod: method,
        createdAt: d(-i),
      },
    });
  }

  // ── Knowledge / Documents / Sign / Discuss ────────────────
  await db.note.createMany({
    data: [
      { title: "Welcome to VITTA Knowledge", content: "This workspace is your company home for SOPs, runbooks and how-to guides.\n\nStart here: Creating quotations → Sales app → Docs.", pinned: true },
      { title: "Refund policy (2025)", content: "1. Refunds within 14 days for annual plans.\n2. Pro-rated refunds for quarterly plans.\n3. Enterprise contracts follow MSA clause 7.2.", pinned: true },
      { title: "Warehouse SOP — Goods receipt", content: "Verify PO number → count items → check damage → stamp GRN → enter in Inventory → file paperwork.", pinned: false },
      { title: "How to raise a vendor bill", content: "Purchase app → Vendor Bills → New → attach scanned invoice → match PO → submit for approval.", pinned: false },
      { title: "Quarter close checklist", content: "- Reconcile bank\n- Post all vendor bills\n- Aging review\n- Lock journals\n- Send MIS pack", pinned: false },
    ],
  });

  await db.docFile.createMany({
    data: [
      { name: "VITTA Enterprise License Agreement.pdf", kind: "pdf", sizeKb: 842, folder: "Legal" },
      { name: "FY25-Q2 Financial Statement.pdf", kind: "pdf", sizeKb: 1220, folder: "Finance" },
      { name: "Customer Master List.xlsx", kind: "sheet", sizeKb: 96, folder: "Sales" },
      { name: "Inventory Audit May.xlsx", kind: "sheet", sizeKb: 310, folder: "Operations" },
      { name: "Employee Handbook.docx", kind: "doc", sizeKb: 480, folder: "HR" },
      { name: "Store Front Elevation.png", kind: "image", sizeKb: 2410, folder: "Marketing" },
      { name: "Vendor Portal Mockups.pdf", kind: "pdf", sizeKb: 3320, folder: "Product" },
      { name: "GST Return Filing Notes.docx", kind: "doc", sizeKb: 88, folder: "Finance" },
    ],
  });

  await db.signDoc.createMany({
    data: [
      { name: "Zenith Retail — MSA renewal.pdf", signer: "Priya Sharma", status: "to_sign" },
      { name: "Dev Anand — Offer letter.pdf", signer: "Dev Anand", status: "signed", requestedAt: d(-20), signedAt: d(-18) },
      { name: "Crafts Bazaar — NDA.pdf", signer: "Ishita Bose", status: "to_sign" },
      { name: "Q3 Vendor terms — Sunrise Components.pdf", signer: "Sunrise Components", status: "signed", requestedAt: d(-9), signedAt: d(-7) },
    ],
  });

  const channels = ["general", "sales", "support"];
  const msgs: [string, string, string][] = [
    ["general", "Aarav Mehta", "Welcome to VITTA Discuss! Use channels for team chatter."],
    ["general", "Pooja Reddy", "Reminder: town hall at 4 PM today."],
    ["general", "Sameer Khan", "Warehouse rack B relabeling done."],
    ["sales", "Nisha Fernandes", "Zenith ERP rollout — UAT starts Monday."],
    ["sales", "Lakshmi Pillai", "Sunrise Components quoted 8% lower for scanners."],
    ["sales", "Nisha Fernandes", "Nice, let's renegotiate before PO 0002."],
    ["support", "Tanvi Joshi", "Ticket 0002 escalated to engineering."],
    ["support", "Dev Anand", "Field visit for Spice Route scheduled tomorrow 10 AM."],
    ["general", "Kavya Menon", "Draft for Diwali campaign is ready for review."],
  ];
  let mi = 0;
  for (const [channel, author, content] of msgs) {
    await db.message.create({ data: { channel, author, content, createdAt: new Date(Date.now() - (msgs.length - mi) * 3600000) } });
    mi++;
  }

  const counts = {
    contacts: await db.contact.count(),
    employees: await db.employee.count(),
    products: await db.product.count(),
    leads: await db.lead.count(),
    saleOrders: await db.saleOrder.count(),
    purchaseOrders: await db.purchaseOrder.count(),
    invoices: await db.invoice.count(),
    projects: await db.project.count(),
    tasks: await db.task.count(),
    timesheets: await db.timesheet.count(),
    tickets: await db.helpdeskTicket.count(),
    manufacturingOrders: await db.manufacturingOrder.count(),
    subscriptions: await db.subscription.count(),
    campaigns: await db.campaign.count(),
    posOrders: await db.posOrder.count(),
    notes: await db.note.count(),
    docFiles: await db.docFile.count(),
    signDocs: await db.signDoc.count(),
    messages: await db.message.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
