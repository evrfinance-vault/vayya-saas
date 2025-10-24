import { useEffect, useState } from "react";
import { useApiFetch } from "./http";

export type RiskKey = "LOW" | "MEDIUM" | "HIGH";
export type PlanKey = "SELF" | "KAYYA";
export type StatusKey = "LATE" | "HOLD";

export type LPSummary = {
  delinquentAccounts: number;
  newDelinquentAccounts: number;
  amountOverdueCents: number;
  atRiskCents: number;
  avgDaysOverdue: number;
  missedPaymentsTotal: number;
};

export type LateRow = {
  id: string;
  client: string;
  outstandingCents: number;
  overdueCents: number;
  daysOverdue: number;
  missedPayments: number;
  risk: RiskKey;
  status: StatusKey;
  planType: PlanKey;
};

export const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (cents || 0) / 100,
  );

export function useLatePaymentsSummary() {
  const apiFetch = useApiFetch();
  const [data, setData] = useState<LPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);

    apiFetch("/api/owner/late-payments/summary", { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [apiFetch]);

  return { data, loading };
}

export function useLatePayments(filters?: {
  status?: "ALL" | StatusKey;
  risk?: "ALL" | RiskKey;
  daysMin?: number;
}) {
  const apiFetch = useApiFetch();
  const [rows, setRows] = useState<LateRow[]>([]);
  const [loading, setLoading] = useState(true);

  const status = filters?.status ?? "ALL";
  const risk = filters?.risk ?? "ALL";
  const daysMin = filters?.daysMin ?? 0;

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);

    const qs = new URLSearchParams({
      status,
      risk,
      daysMin: String(daysMin),
    }).toString();

    apiFetch(`/api/owner/late-payments/list?${qs}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((payload) => setRows(payload?.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [status, risk, daysMin, apiFetch]);

  return { rows, loading };
}
