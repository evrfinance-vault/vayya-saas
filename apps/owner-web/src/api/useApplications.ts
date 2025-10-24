import { useEffect, useState } from "react";
import { useApiFetch } from "./http";

export type AppPlan = "ALL" | "SELF" | "KAYYA";
export type AppStatus =
  | "ALL"
  | "SENT"
  | "FAILED"
  | "PENDING"
  | "PAID"
  | "CONTACTED"
  | "DONE";
export type AppRange = "all" | "30d" | "90d" | "ytd";

export type AppSummary = {
  totalApplications: number;
  weeklyApplications: number;
  pendingCount: number;
  reviewCount: number;
  approvalRatePct: number;
  totalRequestedCents: number;
};

export type AppRow = {
  id: string;
  client: string;
  amountCents: number;
  planType: "SELF" | "KAYYA";
  creditScore: number | null;
  completionPct: number;
  status: string;
  submittedAt: string;
};

export function useApplicationsSummary() {
  const apiFetch = useApiFetch();
  const [data, setData] = useState<AppSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctl = new AbortController();
    apiFetch("/api/owner/applications/summary", { signal: ctl.signal })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [apiFetch]);
  return { data, loading };
}

export function useApplications(
  range: AppRange,
  status: AppStatus,
  plan: AppPlan,
) {
  const apiFetch = useApiFetch();
  const [rows, setRows] = useState<AppRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    const qs = new URLSearchParams({ range, status, plan });
    apiFetch(`/api/owner/applications?${qs.toString()}`, {
      signal: ctl.signal,
    })
      .then((r) => r.json())
      .then((payload) => setRows(payload.rows ?? []))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [range, status, plan, apiFetch]);
  return { rows, loading };
}

// helpers

export const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (cents || 0) / 100,
  );
