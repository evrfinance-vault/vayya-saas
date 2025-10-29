import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import { Header, useDocumentTitle } from "@packages/ui-auth";
import LoansPage from "./pages/LoansPage";
import ProvidersPage from "./pages/ProvidersPage";
import ResourcesPage from "./pages/ResourcesPage";
import SupportPage from "./pages/SupportPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

type Nav = { label: string; key: string; href: string };

function TitleSetter({
  brand,
  navLinks,
  hiddenNavLinks,
}: {
  brand: string;
  navLinks: Nav[];
  hiddenNavLinks: Nav[];
}): React.ReactElement {
  const { pathname } = useLocation();
  const match = navLinks.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
  );
  const matchHidden = hiddenNavLinks.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
  );

  useDocumentTitle(
    match
      ? `${brand} » ${match.label}`
      : matchHidden
        ? `${brand} » ${matchHidden.label}`
        : `${brand} » Page Not Found`,
  );
  return <></>;
}

export default function App(): React.ReactElement {
  const navLinks = [
    { label: "Loans", key: "loans", href: "/" },
    { label: "Providers", key: "providers", href: "/providers" },
    { label: "Resources", key: "resources", href: "/resources" },
    { label: "Support", key: "support", href: "/support" },
  ];

  const hiddenNavLinks = [
    { label: "Settings", key: "settings", href: "/settings" },
  ];

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <TitleSetter
        brand="Kayya"
        navLinks={navLinks}
        hiddenNavLinks={hiddenNavLinks}
      />

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
        <Route path="/" element={<LoansPage />} />
        <Route path="/providers" element={<ProvidersPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
