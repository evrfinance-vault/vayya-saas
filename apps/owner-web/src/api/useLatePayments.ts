import { useEffect, useState } from "react";

const API =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export type LPSummary = {
  delinquentAccounts: number;
  amountOverdueCents: number;
  atRiskCents: number;
  avgDaysOverdue: number;
};

export type LPRow = {
  id: string;
  client: string;
  outstandingCents: number;
  overdueCents: number;
  daysOverdue: number;
  missedPayments: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  status: "LATE" | "HOLD";
  planType: "SELF" | "KAYYA";
};

export const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (cents || 0) / 100,
  );

export function useLatePaymentsSummary() {
  const [data, setData] = useState<LPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctl = new AbortController();
    fetch(`${API}/api/owner/late-payments/summary`, { signal: ctl.signal })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, []);
  return { data, loading };
}

export function useLatePaymentsRows(
  status: "ALL" | "LATE" | "HOLD",
  risk: "ALL" | "LOW" | "MEDIUM" | "HIGH",
  daysMin: number,
) {
  const [rows, setRows] = useState<LPRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctl = new AbortController();
    const qs = new URLSearchParams({
      status,
      risk,
      daysMin: String(daysMin),
    });
    fetch(`${API}/api/owner/late-payments/list?${qs.toString()}`, {
      signal: ctl.signal,
    })
      .then((r) => r.json())
      .then((p) => setRows(p.rows ?? []))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [status, risk, daysMin]);
  return { rows, loading };
}
