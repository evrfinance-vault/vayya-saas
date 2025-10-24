import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000")
  .toString()
  .replace(/\/$/, "");

const toApiUrl = (path: string) =>
  /^(https?:)?\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

export function useApiFetch() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  const skipAuthOnDev = import.meta.env.VITE_SKIP_AUTH_ON_DEV;

  return useCallback(
    async (input: string, init: RequestInit = {}) => {
      const url = toApiUrl(input);
      const headers = new Headers(init.headers || {});

      if (isAuthenticated && !skipAuthOnDev) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: audience,
              scope: "openid profile email offline_access",
            },
          });

          headers.set("Authorization", `Bearer ${token}`);
          headers.set("Accept", "application/json");
        } catch (e: any) {
          if (e?.name !== "AbortError") {
            console.error("useApiFetch token error:", e);
          }
          throw e;
        }
      }

      return fetch(url, { ...init, headers });
    },
    [getAccessTokenSilently, isAuthenticated],
  );
}
