import { useAuth0 } from "@auth0/auth0-react";

export function useApi() {
  const { getAccessTokenSilently } = useAuth0();
  const baseUrl = (import.meta as any).env.VITE_BACKEND_URL as
    | string
    | undefined;

  if (!baseUrl) {
    console.warn("[useApi] Missing VITE_BACKEND_URL; requests will fail.");
  }

  return async function apiFetch<T = any>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const token = await getAccessTokenSilently().catch((e) => {
      throw new Error(
        "Failed to get access token. Is VITE_AUTH0_AUDIENCE set and the API configured?\n" +
          String(e),
      );
    });
    const url = `${baseUrl ?? ""}${path}`;
    const res = await fetch(url, {
      ...(init || {}),
      headers: {
        ...(init && init.headers ? init.headers : {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text}`);
    }

    const ct = res.headers.get("content-type") || "";

    if (ct.includes("application/json")) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  };
}
