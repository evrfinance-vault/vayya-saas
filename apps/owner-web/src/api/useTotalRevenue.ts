import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export type PlanKey = "ALL" | "SELF" | "KAYYA";

export type TRSummary = {
  allTimeRevenueCents: number;
  ytdRevenueCents: number;
  yoyDeltaPct: number;
  platformFeeBps: number;
  platformFeesYtdCents: number;
};

export type TRMonth = {
  ym: string;
  label: string;
  date: string;
  revenueCents: number;
  loanVolumeCents: number;
  dueCents: number;
  paidCents: number;
  repaymentRatePct: number;
  platformFeesCents: number;
};

export function useTotalRevenueSummary() {
  const [data, setData] = useState<TRSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctl = new AbortController();
    fetch(`${API}/api/owner/total-revenue/summary`, { signal: ctl.signal })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, []);
  return { data, loading };
}

export function useTotalRevenueMonthly(range = "12m", plan: PlanKey = "ALL") {
  const [data, setData] = useState<TRMonth[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);

    fetch(`${API}/api/owner/total-revenue/monthly?range=${range}&plan=${plan}`, { signal: ctl.signal })
      .then(async (r) => {
        const payload = await r.json();
        const arr =
          payload?.months ??
          payload?.rows ??
          payload?.points ??
          (Array.isArray(payload) ? payload : null);
        setData(arr ?? []);
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [range, plan]);

  return { data, loading };
}

// helpers

export const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
    .format((cents || 0) / 100);
