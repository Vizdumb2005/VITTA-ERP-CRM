// ─────────────────────────────────────────────────────────────
// VITTA ERP — shared client-side types & status styles
// ─────────────────────────────────────────────────────────────

export type ID = string;

export interface Contact {
  id: ID;
  name: string;
  email?: string | null;
  phone?: string | null;
  type: "customer" | "vendor" | "both";
  company?: string | null;
  city?: string | null;
  country?: string | null;
  vat?: string | null;
  isCompany: boolean;
  createdAt: string;
}

export interface Employee {
  id: ID;
  name: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  salary: number;
  hireDate?: string | null;
  status: "active" | "on_leave" | "departed";
}

export interface LeaveRequest {
  id: ID;
  employeeId: ID;
  employeeName?: string | null;
  type: "casual" | "sick" | "earned" | "unpaid";
  from: string;
  to: string;
  days: number;
  status: "pending" | "approved" | "refused";
  reason?: string | null;
  createdAt: string;
}

export type LeadStage = "new" | "qualified" | "proposition" | "negotiation" | "won" | "lost";

export interface Lead {
  id: ID;
  name: string;
  contactName?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  expectedRevenue: number;
  stage: LeadStage;
  priority: number; // 0..3
  source?: string | null;
  ownerName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Product {
  id: ID;
  name: string;
  sku: string;
  category?: string | null;
  type: "goods" | "service";
  price: number;
  cost: number;
  qty: number;
  unit: string;
  createdAt: string;
}

export interface OrderLine {
  id?: ID;
  description: string;
  qty: number;
  price: number;
}

export type SaleStatus = "quotation" | "sent" | "sale" | "done" | "cancel";

export interface SaleOrder {
  id: ID;
  number: string;
  customerId: ID;
  customerName: string;
  date: string;
  status: SaleStatus;
  notes?: string | null;
  total: number;
  lines: OrderLine[];
  createdAt: string;
}

export type PurchaseStatus = "rfq" | "confirmed" | "received" | "cancel";

export interface PurchaseOrder {
  id: ID;
  number: string;
  vendorId: ID;
  vendorName: string;
  date: string;
  status: PurchaseStatus;
  notes?: string | null;
  total: number;
  lines: OrderLine[];
  createdAt: string;
}

export interface Invoice {
  id: ID;
  number: string;
  type: "customer" | "vendor";
  contactId: ID;
  contactName: string;
  date: string;
  dueDate?: string | null;
  status: "draft" | "posted" | "paid";
  notes?: string | null;
  total: number;
  lines: OrderLine[];
  createdAt: string;
}

export interface Project {
  id: ID;
  name: string;
  color: string;
  status: "active" | "done" | "archived";
  deadline?: string | null;
  createdAt: string;
}

export interface Task {
  id: ID;
  title: string;
  projectId: ID;
  projectName?: string | null;
  stage: "todo" | "in_progress" | "review" | "done";
  priority: number; // 0 | 1
  assignee?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

export interface Timesheet {
  id: ID;
  employeeId: ID;
  employeeName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  date: string;
  hours: number;
  description?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: ID;
  title: string;
  category: "helpdesk" | "field";
  customerId?: string | null;
  customerName?: string | null;
  stage: "new" | "in_progress" | "on_hold" | "resolved" | "cancelled";
  priority: "low" | "medium" | "high";
  assignee?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface ManufacturingOrder {
  id: ID;
  number: string;
  productId: ID;
  productName?: string | null;
  qty: number;
  status: "draft" | "confirmed" | "in_progress" | "done" | "cancelled";
  scheduledDate?: string | null;
  assignee?: string | null;
  createdAt: string;
}

export interface Subscription {
  id: ID;
  name: string;
  plan: "starter" | "gold" | "enterprise";
  amount: number;
  status: "active" | "paused" | "churned";
  renewalDate?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  createdAt: string;
}

export interface Campaign {
  id: ID;
  name: string;
  subject?: string | null;
  status: "draft" | "sent";
  recipients: number;
  opens: number;
  clicks: number;
  sentAt?: string | null;
  createdAt: string;
}

export interface PosOrder {
  id: ID;
  number: string;
  total: number;
  itemsCount: number;
  items: { name: string; qty: number; price: number }[];
  paymentMethod: "cash" | "card" | "upi";
  cashier: string;
  createdAt: string;
}

export interface Note {
  id: ID;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface DocFile {
  id: ID;
  name: string;
  kind: "pdf" | "sheet" | "doc" | "image" | "folder" | "link";
  sizeKb: number;
  owner: string;
  folder: string;
  createdAt: string;
}

export interface SignDoc {
  id: ID;
  name: string;
  signer: string;
  status: "to_sign" | "signed";
  requestedAt: string;
  signedAt?: string | null;
}

export interface Message {
  id: ID;
  channel: string;
  author: string;
  content: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Status → label + badge styles (single source of truth)
// ─────────────────────────────────────────────────────────────

export interface StatusStyle {
  label: string;
  className: string;
}

export const STATUS_STYLES: Record<string, StatusStyle> = {
  // CRM stages
  new: { label: "New", className: "bg-sky-100 text-sky-800 border-sky-200" },
  qualified: { label: "Qualified", className: "bg-teal-100 text-teal-800 border-teal-200" },
  proposition: { label: "Proposition", className: "bg-amber-100 text-amber-800 border-amber-200" },
  negotiation: { label: "Negotiation", className: "bg-orange-100 text-orange-800 border-orange-200" },
  won: { label: "Won", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  lost: { label: "Lost", className: "bg-rose-100 text-rose-700 border-rose-200" },
  // Sales
  quotation: { label: "Quotation", className: "bg-sky-100 text-sky-800 border-sky-200" },
  sent: { label: "Quotation Sent", className: "bg-violet-100 text-violet-800 border-violet-200" },
  sale: { label: "Sales Order", className: "bg-amber-100 text-amber-800 border-amber-200" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancel: { label: "Cancelled", className: "bg-rose-100 text-rose-700 border-rose-200" },
  // Purchase
  rfq: { label: "RFQ", className: "bg-sky-100 text-sky-800 border-sky-200" },
  confirmed: { label: "Purchase Order", className: "bg-amber-100 text-amber-800 border-amber-200" },
  received: { label: "Received", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  // Accounting
  draft: { label: "Draft", className: "bg-stone-100 text-stone-700 border-stone-200" },
  posted: { label: "Posted", className: "bg-amber-100 text-amber-800 border-amber-200" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  // Tasks
  todo: { label: "To Do", className: "bg-stone-100 text-stone-700 border-stone-200" },
  in_progress: { label: "In Progress", className: "bg-sky-100 text-sky-800 border-sky-200" },
  review: { label: "In Review", className: "bg-amber-100 text-amber-800 border-amber-200" },
  // HR
  active: { label: "Active", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  on_leave: { label: "On Leave", className: "bg-amber-100 text-amber-800 border-amber-200" },
  departed: { label: "Departed", className: "bg-stone-100 text-stone-600 border-stone-200" },
  pending: { label: "To Approve", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  refused: { label: "Refused", className: "bg-rose-100 text-rose-700 border-rose-200" },
  // Helpdesk
  on_hold: { label: "On Hold", className: "bg-stone-100 text-stone-700 border-stone-200" },
  resolved: { label: "Solved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-700 border-rose-200" },
  // Subscriptions
  paused: { label: "Paused", className: "bg-stone-100 text-stone-700 border-stone-200" },
  churned: { label: "Churned", className: "bg-rose-100 text-rose-700 border-rose-200" },
  // Priority
  low: { label: "Low", className: "bg-stone-100 text-stone-600 border-stone-200" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-800 border-amber-200" },
  high: { label: "High", className: "bg-rose-100 text-rose-700 border-rose-200" },
  // Sign
  to_sign: { label: "To Sign", className: "bg-amber-100 text-amber-800 border-amber-200" },
  signed: { label: "Signed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  // Contacts
  customer: { label: "Customer", className: "bg-violet-100 text-violet-800 border-violet-200" },
  vendor: { label: "Vendor", className: "bg-teal-100 text-teal-800 border-teal-200" },
  both: { label: "Customer & Vendor", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

export const CURRENT_USER = "Aarav Mehta";
