import React from "react";
import { Header } from "@packages/ui-auth";
import { useAuth0 } from "@auth0/auth0-react";

export default function App() {
  const { user } = useAuth0();
  const label = user?.name || user?.email || "User";

  return (
    <div>
      <Header
        title="vault"
        navLinks={[
          { label: "Overview", key: "overview", href: "http://localhost:5173", active: true },
          { label: "Calendar", key: "calendar", href: "http://localhost:5173" },
          { label: "Payment Plans", key: "plans", href: "http://localhost:5173" },
          { label: "Customers", key: "customers", href: "http://localhost:5173" },
          { label: "Applications", key: "applications", href: "http://localhost:5173" },
          { label: "Reports", key: "reports", href: "http://localhost:5173" }
        ]}
      />
      <div style={{ padding: 24, display: "grid", gap: 12 }}>
        <h1>Good Morning, {label}</h1>
      </div>
    </div>
  );
}
