import { useEffect, useState } from "react";
import { useApiFetch } from "./http";

export type RevenuePoint = {
  date: string;
  self: number;
  kayya: number;
};

export type RevenuePayload = {
  points: RevenuePoint[];
  max: number;
};

type Options =
  | { bucket?: "week"; weeks?: number }
  | { bucket: "month"; months?: number };

export function useOwnerRevenueByPlan(opts?: Options) {
  const bucket = opts?.bucket ?? "week";
  const weeks = bucket === "week" ? ((opts as any)?.weeks ?? 52) : undefined;
  const months = bucket === "month" ? ((opts as any)?.months ?? 12) : undefined;

  const apiFetch = useApiFetch();
  const [data, setData] = useState<RevenuePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    const params = new URLSearchParams();
    params.set("bucket", bucket);
    if (bucket === "week" && weeks) params.set("weeks", String(weeks));
    if (bucket === "month" && months) params.set("months", String(months));

    setLoading(true);
    apiFetch(
      `/api/owner/overview/revenue-by-plan?${params.toString()}`,
      { signal: ctl.signal },
    )
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [bucket, weeks, months, apiFetch]);

  return { data, loading };
}
