// VITTA ERP — Convex-backed data helpers.
// Replaces the previous /api/* REST wrapper.

import { convex } from "./convex-client";
import { api as convexApi } from "../../../convex/_generated/api";

export const api = {
  async list<T>(resource: string, params?: Record<string, string | undefined>): Promise<T[]> {
    const args: Record<string, unknown> = { table: resource };
    if (params) {
      const filter: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") {
          if (k === "q") {
            args.search = v;
          } else {
            filter[k] = v;
          }
        }
      }
      if (Object.keys(filter).length) {
        args.filter = filter;
      }
    }
    return convex.query(convexApi.crud.list, args as any);
  },
  async create<T>(resource: string, data: unknown): Promise<T> {
    const result = await convex.mutation(convexApi.crud.create, { table: resource, data });
    return result as T;
  },
  async update<T>(resource: string, id: string, data: unknown): Promise<T> {
    return convex.mutation(convexApi.crud.update, { table: resource, id, data }) as Promise<T>;
  },
  async remove(resource: string, id: string): Promise<{ ok: true }> {
    return convex.mutation(convexApi.crud.remove, { table: resource, id });
  },
};
