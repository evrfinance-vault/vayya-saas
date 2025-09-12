import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

type Props = {
  expectedRole: "owner" | "borrower" | "admin";
  children: React.ReactNode;
};

export function RoleGate({ expectedRole, children }: Props) {
  const { user } = useAuth0();
  const claimKey =
    (import.meta as any).env.VITE_AUTH0_ROLE_CLAIM ||
    "https://vault.evr.finance/role";
  const role = (user as Record<string, any> | undefined)?.[claimKey];

  if (!role) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        No role present in token.
      </div>
    );
  }

  if (role !== expectedRole) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        Not authorized for this dashboard.
      </div>
    );
  }

  return <>{children}</>;
}
