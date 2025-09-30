import { useEffect, useState } from "react";

export type NameItem = {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  badge: "Hold" | "Pending" | "Paid" | "Due Today" | string;
  amountCents: number;
  dueDate: string;
};

export function useOwnerOverviewName(limit = 8) {
  const [items, setItems] = useState<NameItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    fetch(`http://localhost:4000/api/owner/overview/name?limit=${limit}`, {
      signal: ctl.signal,
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [limit]);

  return { items, loading };
}
