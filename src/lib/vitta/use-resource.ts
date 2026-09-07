"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface UseResourceReturn<T extends { id: string }> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  create: (data: Partial<T> & Record<string, unknown>) => Promise<T>;
  update: (id: string, data: Partial<T> & Record<string, unknown>) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

function buildQueryArgs(
  resource: string,
  params?: Record<string, string | undefined>
): Record<string, unknown> {
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
  return args;
}

export function useResource<T extends { id: string }>(
  resource: string,
  params?: Record<string, string | undefined>
): UseResourceReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const paramsRef = useRef(params);
  const mounted = useRef(true);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const queryArgs = useMemo(
    () => buildQueryArgs(resource, params),
    [resource, params]
  );

  const convexItems = useQuery(api.crud.list, queryArgs as any);
  const convexCreate = useMutation(api.crud.create);
  const convexUpdate = useMutation(api.crud.update);
  const convexRemove = useMutation(api.crud.remove);

  const loading = convexItems === undefined;

  useEffect(() => {
    if (convexItems !== undefined) {
      setItems(convexItems as T[]); // eslint-disable-line react-hooks/set-state-in-effect -- bridge Convex reactivity to local state
      setError(null);
    }
  }, [convexItems]);

  const reload = useCallback(async () => {
    // Convex useQuery auto-updates reactively.
    // This no-op preserves the existing API surface.
  }, []);

  const create = useCallback(
    async (data: Partial<T> & Record<string, unknown>) => {
      try {
        const result = await convexCreate({ table: resource, data });
        return result as T;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create";
        if (mounted.current) setError(msg);
        toast.error(msg);
        throw e;
      }
    },
    [resource, convexCreate]
  );

  const update = useCallback(
    async (id: string, data: Partial<T> & Record<string, unknown>) => {
      try {
        const result = await convexUpdate({ table: resource, id, data });
        return result as T;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update";
        if (mounted.current) setError(msg);
        toast.error(msg);
        throw e;
      }
    },
    [resource, convexUpdate]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await convexRemove({ table: resource, id });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete";
        if (mounted.current) setError(msg);
        toast.error(msg);
        throw e;
      }
    },
    [resource, convexRemove]
  );

  return { items, setItems, loading, error, reload, create, update, remove };
}
