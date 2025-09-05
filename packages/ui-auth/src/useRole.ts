import { useAuth0 } from "@auth0/auth0-react";

export function useRole(): "owner" | "borrower" | "admin" | undefined {
  const { user } = useAuth0();
  const claimKey = (import.meta as any).env.VITE_AUTH0_ROLE_CLAIM || "https://vault.evr.finance/role";
  const role = (user as Record<string, any> | undefined)?.[claimKey];
  return role as any;
}
