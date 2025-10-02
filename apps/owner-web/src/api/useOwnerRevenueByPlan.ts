import { useEffect, useState } from "react";

export type RevenuePoint = {
  label: string;
  date: string;
  self: number;
  kayya: number;
};
export type RevenuePayload = { points: RevenuePoint[]; max: number };

export function useOwnerRevenueByPlan(months = 12) {
  const [data, setData] = useState<RevenuePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    fetch(
      `http://localhost:4000/api/owner/overview/revenue-by-plan?months=${months}`,
      { signal: ctl.signal },
    )
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [months]);

  return { data, loading };
}
