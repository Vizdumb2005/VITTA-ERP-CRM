"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "./api";

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

/**
 * Standard VITTA data hook: loads a collection from /api/{resource},
 * exposes CRUD helpers that keep local state in sync + toast on errors.
 */
export function useResource<T extends { id: string }>(
  resource: string,
  params?: Record<string, string | undefined>
): UseResourceReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params ?? {});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const data = await api.list<T>(resource, params ?? undefined);
      if (mounted.current) {
        setItems(data);
        setError(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load data";
      if (mounted.current) setError(msg);
      toast.error(msg);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [resource, paramsKey]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  const create = useCallback(
    async (data: Partial<T> & Record<string, unknown>) => {
      const item = await api.create<T>(resource, data);
      if (mounted.current) setItems((prev) => [item, ...prev]);
      return item;
    },
    [resource]
  );

  const update = useCallback(
    async (id: string, data: Partial<T> & Record<string, unknown>) => {
      const item = await api.update<T>(resource, id, data);
      if (mounted.current) setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
      return item;
    },
    [resource]
  );

  const remove = useCallback(
    async (id: string) => {
      await api.remove(resource, id);
      if (mounted.current) setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [resource]
  );

  return { items, setItems, loading, error, reload, create, update, remove };
}
