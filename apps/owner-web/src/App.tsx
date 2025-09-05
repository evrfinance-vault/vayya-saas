import React from "react";
import {
  useGreeting,
  useDateStamp,
  Header,
  UserBadge,
} from "@packages/ui-auth";

const preheading: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontWeight: 500,
  marginBottom: 0,
  gap: 4,
  fontSize: "small"
};
const heading: React.CSSProperties = {
  fontWeight: 300,
  marginTop: 0,
};
const tinydot: React.CSSProperties = {
  fontSize: "xx-small"
};

export default function App() {
  const greeting = useGreeting();
  const today = useDateStamp();

  return (
    <div>
      <Header
        title="vault"
        navLinks={[
          {
            label: "Overview",
            key: "overview",
            href: "http://localhost:5173",
            active: true,
          },
          { label: "Calendar", key: "calendar", href: "http://localhost:5173" },
          {
            label: "Payment Plans",
            key: "plans",
            href: "http://localhost:5173",
          },
          {
            label: "Customers",
            key: "customers",
            href: "http://localhost:5173",
          },
          {
            label: "Applications",
            key: "applications",
            href: "http://localhost:5173",
          },
          { label: "Reports", key: "reports", href: "http://localhost:5173" },
        ]}
      />
      <div style={{ padding: 24, marginLeft: 12, display: "grid", gap: 0 }}>
        <div style={preheading}>
          <span style={tinydot}>🟢</span>
          Live Dashboard • {today}
        </div>
        <h1 style={heading}>
          {greeting}, <UserBadge />
        </h1>
      </div>
    </div>
  );
}
