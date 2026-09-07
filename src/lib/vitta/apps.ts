// VITTA ERP — app registry (24 business apps, Odoo-style launcher)

export interface AppDef {
  id: string;
  name: string;
  blurb: string;
  group: "Finance" | "Sales" | "Operations" | "Productivity" | "Marketing" | "Sites" | "HR" | "Insight";
}

export const APPS: AppDef[] = [
  { id: "accounting", name: "Accounting", blurb: "Invoices, payments & reports", group: "Finance" },
  { id: "knowledge", name: "Knowledge", blurb: "Company wiki & notes", group: "Productivity" },
  { id: "sign", name: "Sign", blurb: "Electronic signatures", group: "Productivity" },
  { id: "crm", name: "CRM", blurb: "Leads & pipeline", group: "Sales" },
  { id: "studio", name: "Studio", blurb: "Customize VITTA apps", group: "Insight" },
  { id: "subscriptions", name: "Subscriptions", blurb: "Recurring revenue", group: "Sales" },
  { id: "ai", name: "AI", blurb: "VITTA AI assistant", group: "Insight" },
  { id: "pos", name: "Point of Sale", blurb: "Retail & restaurant", group: "Sales" },
  { id: "discuss", name: "Discuss", blurb: "Team chat", group: "Productivity" },
  { id: "documents", name: "Documents", blurb: "File management", group: "Productivity" },
  { id: "project", name: "Project", blurb: "Tasks & kanban", group: "Operations" },
  { id: "timesheets", name: "Timesheets", blurb: "Track work hours", group: "Operations" },
  { id: "fieldservice", name: "Field Service", blurb: "On-site interventions", group: "Operations" },
  { id: "planning", name: "Planning", blurb: "Shifts & scheduling", group: "Operations" },
  { id: "helpdesk", name: "Helpdesk", blurb: "Support tickets", group: "Operations" },
  { id: "ecommerce", name: "eCommerce", blurb: "Online store", group: "Sites" },
  { id: "website", name: "Website", blurb: "Site builder", group: "Sites" },
  { id: "email", name: "Email Marketing", blurb: "Campaigns & newsletters", group: "Marketing" },
  { id: "purchase", name: "Purchase", blurb: "RFQs & vendor bills", group: "Operations" },
  { id: "inventory", name: "Inventory", blurb: "Products & stock", group: "Operations" },
  { id: "manufacturing", name: "Manufacturing", blurb: "MRP & shop floor", group: "Operations" },
  { id: "sales", name: "Sales", blurb: "Quotations & orders", group: "Sales" },
  { id: "hr", name: "HR", blurb: "Employees & time off", group: "HR" },
  { id: "dashboard", name: "Dashboard", blurb: "Company KPIs", group: "Insight" },
];

export function getApp(id: string | null): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}
