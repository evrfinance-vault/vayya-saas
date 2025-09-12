import React from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { Header, useDocumentTitle } from "@packages/ui-auth";
import "./styles/global.css";

import OverviewPage from "./pages/OverviewPage";
import CalendarPage from "./pages/CalendarPage";
import PaymentPlansPage from "./pages/PaymentPlansPage";
import CustomersPage from "./pages/CustomersPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ReportsPage from "./pages/ReportsPage";
import NotFoundPage from "./pages/NotFoundPage";

const demoNotifications = [
  { id: "n1", title: "New loan application", body: "Alexander Toothman", unread: true, createdAt: "2h ago", href: "#" },
  { id: "n2", title: "Payment received", body: "Invoice #1042", unread: false, createdAt: "Yesterday", href: "#" },
  { id: "n3", title: "Profile updated", body: "Katherine Meyers", unread: false, createdAt: "Last week", href: "#" }
];

type Nav = { label: string; key: string; href: string };

function TitleSetter({
  brand,
  navLinks
}: {
  brand: string;
  navLinks: Nav[];
}): React.ReactElement {
  const { pathname } = useLocation();
  const match = navLinks.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
  );

  useDocumentTitle(match ? `${brand} » ${match.label}` : `${brand} » Page Not Found`);
  return null;
}

export default function App(): React.ReactElement {
  const navLinks = [
    { label: "Overview",      key: "overview",     href: "/" },
    { label: "Calendar",      key: "calendar",     href: "/calendar" },
    { label: "Payment Plans", key: "plans",        href: "/payment-plans" },
    { label: "Customers",     key: "customers",    href: "/customers" },
    { label: "Applications",  key: "applications", href: "/applications" },
    { label: "Reports",       key: "reports",      href: "/reports" }
  ];

  return (
    <BrowserRouter>
      <TitleSetter brand="Vault" navLinks={navLinks} />

      <Header
        title="vault"
        navLinks={navLinks}
        renderLink={(l) => (
          <NavLink
            key={l.key}
            to={l.href}
            end={l.href === "/"}
            className="header-link"
          >
            <small>{l.label}</small>
          </NavLink>
        )}
        notifications={demoNotifications}
      />

      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/payment-plans" element={<PaymentPlansPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
