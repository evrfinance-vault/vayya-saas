import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export type PayoutsResp = {
  year: number;
  month: number;
  totals: Record<number, number>;
};

export type PayoutItem = {
  id: string;
  name: string;
  amountCents: number;
  status: "PAID" | "PENDING" | "HOLD";
  effectiveAt: string;
  planType: "SELF" | "KAYYA";
};

export function useOwnerPayoutsByDay(year: number, month1: number) {
  const [data, setData] = useState<PayoutsResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    fetch(
      `${API}/api/owner/overview/payouts-by-day?year=${year}&month=${month1}`,
      { signal: ctl.signal },
    )
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [year, month1]);

  return { data, loading };
}

export function usePayoutsWindow(startISO: string, endISO: string) {
  const [items, setItems] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startISO || !endISO) return;
    const ctl = new AbortController();
    setLoading(true);
    fetch(`${API}/api/owner/overview/payouts-window?start=${startISO}&end=${endISO}`, { signal: ctl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(payload => setItems(payload?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [startISO, endISO]);

  return { items, loading };
}
