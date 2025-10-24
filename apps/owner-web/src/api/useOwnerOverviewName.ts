import { useEffect, useState } from "react";
import { useApiFetch } from "./http";

export type NameItem = {
  id: string;
  name: string;
  initials: string;
  methodLabel: string;
  badge: "Hold" | "Pending" | "Paid" | "Due Today" | string;
  amount: number;
  dueDate: Date;
};

export function useOwnerOverviewName(limit = 8) {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<NameItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    apiFetch(`/api/owner/overview/name?limit=${limit}`, {
      signal: ctl.signal,
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [limit, apiFetch]);

  return { items, loading };
}
