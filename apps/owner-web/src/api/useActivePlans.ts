import { useEffect, useMemo, useState } from "react";
import { useApiFetch } from "./http";

export type PlanKey = "ALL" | "SELF" | "KAYYA";
export type PlanStatus = "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";

export type ActivePlanRow = {
  id: string;
  client: string;
  amountCents: number;
  outstandingCents: number;
  aprBps: number;
  termMonths: number;
  progressPct: number;
  status: PlanStatus;
  planType: PlanKey;
};

export type RangeKey = "3m" | "6m" | "12m" | "ytd" | "ltd";

export function useActivePlans(
  range: RangeKey,
  status: PlanStatus | "ALL",
  plan: PlanKey,
) {
  const apiFetch = useApiFetch();
  const [rows, setRows] = useState<ActivePlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    const qs = new URLSearchParams({
      range,
      plan,
      status,
    }).toString();

    setLoading(true);
    apiFetch(`/api/owner/active-plans?${qs}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((payload) => {
        const arr = payload?.rows ?? (Array.isArray(payload) ? payload : []);
        setRows(arr);
      })
      .catch(() => {
        const mock: ActivePlanRow[] = [
          {
            id: "PLAN-001",
            client: "John Smith",
            amountCents: 1500000,
            outstandingCents: 1250000,
            aprBps: 499,
            termMonths: 24,
            progressPct: 25,
            status: "ACTIVE",
            planType: "SELF",
          },
          {
            id: "PLAN-002",
            client: "Grace Lee",
            amountCents: 820000,
            outstandingCents: 447010,
            aprBps: 725,
            termMonths: 12,
            progressPct: 58,
            status: "ACTIVE",
            planType: "KAYYA",
          },
          {
            id: "PLAN-003",
            client: "Sebastian Sanchez",
            amountCents: 3900075,
            outstandingCents: 572303,
            aprBps: 899,
            termMonths: 18,
            progressPct: 100,
            status: "PAID",
            planType: "SELF",
          },
        ];
        setRows(mock);
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [range, status, plan, apiFetch]);

  const summary = useMemo(() => {
    const inScope = rows.filter((r) => r.status !== "PAID");
    const totalFinanced = rows.reduce((s, r) => s + r.amountCents, 0);
    const outstanding = inScope.reduce((s, r) => s + r.outstandingCents, 0);
    const avgAprBps = rows.length
      ? Math.round(rows.reduce((s, r) => s + r.aprBps, 0) / rows.length)
      : 0;

    return {
      activeCount: inScope.length,
      totalFinancedCents: totalFinanced,
      interestEarnedYtdCents: rows.reduce((sum, r) => {
        const totalInterest = Math.round(
          (r.amountCents * (r.aprBps || 0)) / 10000,
        );
        const ytdFraction =
          Math.min(12, Math.max(1, r.termMonths)) / Math.max(1, r.termMonths);
        const paidFraction = (r.progressPct || 0) / 100;
        return sum + Math.round(totalInterest * ytdFraction * paidFraction);
      }, 0),
      outstandingCents: outstanding,
      avgAprBps,
    };
  }, [rows]);

  return { rows, summary, loading };
}

// formatters

export const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (cents || 0) / 100,
  );

export const fmtAPR = (bps: number) => `${(bps / 100).toFixed(2)}%`;
