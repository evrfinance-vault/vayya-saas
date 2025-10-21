import { useEffect, useState } from "react";

export type AccountHealthData = {
  totalPlans: number;
  totalPrincipalCents: number;
  byHealth: { EXCELLENT: number; GOOD: number; FAIR: number; POOR: number };
};

export function useOwnerAccountHealth() {
  const [data, setData] = useState<AccountHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    fetch("http://localhost:4000/api/owner/overview/account-health", {
      signal: ctl.signal,
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, []);

  return { data, loading };
}
