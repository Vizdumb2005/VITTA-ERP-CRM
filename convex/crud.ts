import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function timestamp() {
  return Date.now();
}

const LINE_TABLES: Record<string, { table: string; index: string; field: string }> = {
  saleOrders: { table: "saleOrderLines", index: "by_orderId", field: "orderId" },
  purchaseOrders: { table: "purchaseOrderLines", index: "by_orderId", field: "orderId" },
  invoices: { table: "invoiceLines", index: "by_invoiceId", field: "invoiceId" },
};

function withId<T extends { _id: any }>(item: T): T & { id: string } {
  return { ...item, id: item._id };
}

function withIds<T extends { _id: any }>(items: T[]): Array<T & { id: string }> {
  return items.map(withId);
}

function enrichItems(ctx: any, table: string, items: any[]) {
  if (table === "saleOrders" || table === "purchaseOrders" || table === "invoices") {
    const { table: linesTable, index, field } = LINE_TABLES[table];
    return Promise.all(
      items.map(async (item) => {
        const lines = await ctx.db
          .query(linesTable)
          .withIndex(index, (q: any) => q.eq(field, item._id))
          .collect();
        const total = lines.reduce((s: number, l: any) => s + l.qty * l.price, 0);
        const contactId = item.customerId || item.vendorId || item.contactId;
        let contactName: string | null = null;
        if (contactId) {
          const contact = await ctx.db.get(contactId);
          contactName = contact?.name ?? null;
        }
        const nameField = table === "purchaseOrders" ? "vendorName" : "contactName";
        return withId({ ...item, lines, total, [nameField]: contactName });
      })
    );
  }
  if (table === "helpdeskTickets") {
    return Promise.all(
      items.map(async (item) => {
        let customerName: string | null = null;
        if (item.customerId) {
          const contact = await ctx.db.get(item.customerId);
          customerName = contact?.name ?? null;
        }
        return withId({ ...item, customerName });
      })
    );
  }
  if (table === "subscriptions") {
    return Promise.all(
      items.map(async (item) => {
        let customerName: string | null = null;
        if (item.customerId) {
          const contact = await ctx.db.get(item.customerId);
          customerName = contact?.name ?? null;
        }
        return withId({ ...item, customerName });
      })
    );
  }
  return Promise.resolve(withIds(items));
}

export const list = query({
  args: {
    table: v.string(),
    search: v.optional(v.string()),
    filter: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    let items = await (ctx.db as any).query(args.table).collect();

    if (args.filter) {
      items = items.filter((item: any) => {
        return Object.entries(args.filter).every(([key, val]) => item[key] === val);
      });
    }

    if (args.search) {
      const lower = args.search.toLowerCase();
      items = items.filter((item: any) => {
        return Object.values(item).some((val: any) =>
          typeof val === "string" && val.toLowerCase().includes(lower)
        );
      });
    }

    return await enrichItems(ctx, args.table, items);
  },
});

export const get = query({
  args: { table: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    const doc = await (ctx.db as any).get(args.id);
    if (!doc) return null;
    return await enrichItems(ctx, args.table, [doc]).then((r) => r[0]);
  },
});

export const create = mutation({
  args: { table: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const now = timestamp();
    const prepared: Record<string, unknown> = { ...args.data };
    for (const key of Object.keys(prepared)) {
      if (prepared[key] === undefined) delete prepared[key];
    }
    if (!prepared.createdAt) prepared.createdAt = now;
    if (!prepared.updatedAt) prepared.updatedAt = now;
    if (!prepared.requestedAt) prepared.requestedAt = now;
    const id = await (ctx.db as any).insert(args.table, prepared);
    const doc = await (ctx.db as any).get(id);
    return withId(doc);
  },
});

export const update = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const doc = await (ctx.db as any).get(args.id);
    if (!doc) throw new Error("Record not found");
    const lines = Array.isArray(args.data.lines) ? args.data.lines : null;
    const updateData: Record<string, unknown> = { ...args.data };
    delete updateData.lines;
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === undefined || updateData[key] === "") {
        delete updateData[key];
      }
    }
    if (Object.keys(updateData).length) {
      await (ctx.db as any).patch(args.id, updateData);
    }
    if (lines !== null) {
      const linesTable = LINE_TABLES[args.table];
      if (linesTable) {
        const existing = await (ctx.db as any)
          .query(linesTable.table)
          .withIndex(linesTable.index, (q: any) => q.eq(linesTable.field, args.id))
          .collect();
        for (const line of existing) {
          await (ctx.db as any).delete(line._id);
        }
        if (lines.length) {
          for (const line of lines) {
            await (ctx.db as any).insert(linesTable.table, {
              orderId: args.id,
              description: String(line.description ?? "").trim(),
              qty: Number(line.qty || 1),
              price: Number(line.price || 0),
            });
          }
        }
      }
    }
    const updated = await (ctx.db as any).get(args.id);
    return enrichItems(ctx, args.table, [updated]).then((r) => r[0]);
  },
});

export const remove = mutation({
  args: { table: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    const doc = await (ctx.db as any).get(args.id);
    if (!doc) throw new Error("Record not found");
    await (ctx.db as any).delete(args.id);
    return { ok: true as const };
  },
});
