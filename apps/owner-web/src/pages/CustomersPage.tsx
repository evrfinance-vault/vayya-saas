import React from "react";
import { useSearchParams } from "react-router-dom";
import OverviewTabs, { type TabDef } from "../components/OverviewTabs";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import "./OverviewPage.css";
import "./CustomersPage.css";
import { CustomersPanel } from "../components/panels";
import { useActivePlans } from "../api/useActivePlans";

export type CustomersTabKey = "customers";

const TABS: TabDef[] = [
  { key: "customers" as any, icon: faUsers, label: "Active Customers" },
];

export default function CustomersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab =
    (searchParams.get("tab") as CustomersTabKey) || "customers";
  const [tab, setTab] = React.useState<CustomersTabKey>(defaultTab);

  React.useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  }, [tab, setSearchParams]);

  React.useEffect(() => {
    const next = (searchParams.get("tab") as CustomersTabKey) || "customers";
    setTab(next);
  }, [setTab, searchParams]);

  const {
    rows: _raw,
    summary,
    loading: _loading,
  } = useActivePlans("ltd", "ALL", "ALL");

  const tabs = React.useMemo(
    () =>
      TABS.map((t) =>
        t.key === "customers"
          ? {
              ...t,
              badge: String(summary?.activeCount ?? 0),
            }
          : t,
      ),
    [summary],
  );

  return (
    <div className="page-content">
      <div className="overview-hero">
        <div className="preheading" style={{ fontSize: "small" }}>
          Borrowers with Payment Plans
        </div>
        <h1 className="heading">Customers</h1>
        <p className="hero-blurb">
          View, manage, and edit the borrower accounts with active payment plans
          for your small business.
        </p>
      </div>
      <div className="customers-page">
        <OverviewTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as CustomersTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="customers-panels customers-tab-change"
        >
          {tab === "customers" && <CustomersPanel />}
        </div>
      </div>
    </div>
  );
}
