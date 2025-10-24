import { useEffect, useState } from "react";
import { useApiFetch } from "./http";

export type PlanKey = "ALL" | "SELF" | "KAYYA";

export type TRSummary = {
  allTimeRevenueCents: number;
  ytdRevenueCents: number;
  yoyDeltaPct: number;
  platformFeeBps: number;
  platformFeesYtdCents: number;
  interestYtdCents: number;
  lateFeesYtdCents: number;
  avgRepaymentRatePct: number;
};

export type TRMonth = {
  ym: string;
  label: string;
  date?: string;
  revenueCents: number;
  loanVolumeCents: number;
  dueCents: number;
  paidCents: number;
  onTimeCents?: number;
  repaymentRatePct: number;
  platformFeesCents: number;
  interestCents: number;
  lateFeesCents: number;
};

export function useTotalRevenueSummary() {
  const apiFetch = useApiFetch();
  const [data, setData] = useState<TRSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    apiFetch("/api/owner/total-revenue/summary", { signal: ctl.signal })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [apiFetch]);
  return { data, loading };
}

export function useTotalRevenueMonthly(
  range: "ytd" | "12m" | "all" = "ytd",
  plan: PlanKey = "ALL",
) {
  const apiFetch = useApiFetch();
  const [data, setData] = useState<TRMonth[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    apiFetch(`/api/owner/total-revenue/monthly?range=${range}&plan=${plan}`, {
      signal: ctl.signal,
    })
      .then((r) => r.json())
      .then((payload) => setData(payload.months ?? payload.rows ?? payload))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [range, plan, apiFetch]);

  return { data, loading };
}

// helpers

export const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (cents || 0) / 100,
  );
