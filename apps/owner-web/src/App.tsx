import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import { Header, useDocumentTitle } from "@packages/ui-auth";
import OverviewPage from "./pages/OverviewPage";
import PaymentPlansPage from "./pages/PaymentPlansPage";
import CustomersPage from "./pages/CustomersPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ReportsPage from "./pages/ReportsPage";
import NotFoundPage from "./pages/NotFoundPage";

type Nav = { label: string; key: string; href: string };

function TitleSetter({
  brand,
  navLinks,
}: {
  brand: string;
  navLinks: Nav[];
}): React.ReactElement {
  const { pathname } = useLocation();
  const match = navLinks.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
  );

  useDocumentTitle(
    match ? `${brand} » ${match.label}` : `${brand} » Page Not Found`,
  );
  return <></>;
}

export default function App(): React.ReactElement {
  const navLinks = [
    { label: "Overview", key: "overview", href: "/" },
    { label: "Payment Plans", key: "plans", href: "/payment-plans" },
    { label: "Customers", key: "customers", href: "/customers" },
    { label: "Applications", key: "applications", href: "/applications" },
    { label: "Reports", key: "reports", href: "/reports" },
  ];

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <TitleSetter brand="Kayya" navLinks={navLinks} />

      <Header
        title="kayya"
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
        showSearch={false}
        showNotifications={false}
      />

      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/payment-plans" element={<PaymentPlansPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
