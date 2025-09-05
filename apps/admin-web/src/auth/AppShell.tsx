import React from "react";
import App from "../App";
import { RequireAuth, RoleGate } from "@packages/ui-auth";

export default function AppShell() {
  return (
    <RequireAuth>
      <RoleGate expectedRole="admin">
        <App />
      </RoleGate>
    </RequireAuth>
  );
}
