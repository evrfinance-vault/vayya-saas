import { useEffect, useState } from "react";

export type PayoutsResp = {
  year: number;
  month: number;
  totals: Record<number, number>;
};

export function useOwnerPayoutsByDay(year: number, month1: number) {
  const [data, setData] = useState<PayoutsResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    fetch(
      `http://localhost:4000/api/owner/overview/payouts-by-day?year=${year}&month=${month1}`,
      { signal: ctl.signal },
    )
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [year, month1]);

  return { data, loading };
}
