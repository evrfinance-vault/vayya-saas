import { useEffect, useState } from "react";
import { useApiFetch } from "./http";

export type AccountHealthData = {
  totalPlans: number;
  totalPrincipalCents: number;
  byHealth: { EXCELLENT: number; GOOD: number; FAIR: number; POOR: number };
};

export function useOwnerAccountHealth() {
  const apiFetch = useApiFetch();
  const [data, setData] = useState<AccountHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    apiFetch("/api/owner/overview/account-health", {
      signal: ctl.signal,
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [apiFetch]);

  return { data, loading };
}
