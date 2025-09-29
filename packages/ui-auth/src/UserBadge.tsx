import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export function UserBadge() {
  const { user } = useAuth0();
  const label =
    (user?.given_name ?? user?.name ?? "").trim().split(/\s+/)[0] || "User";
  return <span>{label}</span>;
}
