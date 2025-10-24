import React from "react";
import { useSearchParams } from "react-router-dom";
import OverviewTabs, { type TabDef } from "../components/OverviewTabs";
import { faChartPie } from "@fortawesome/free-solid-svg-icons";
import "./OverviewPage.css";
import "./ReportsPage.css";
import { ReportsPanel } from "../components/panels";

export type ReportsTabKey = "reports";

export default function ReportsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as ReportsTabKey) || "reports";
  const [tab, setTab] = React.useState<ReportsTabKey>(defaultTab);

  const tabs: TabDef[] = [
    { key: "reports" as any, icon: faChartPie, label: "Generate Reports" },
  ];

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
    const next = (searchParams.get("tab") as ReportsTabKey) || "reports";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="overview-hero">
        <div className="preheading" style={{ fontSize: "small" }}>
          Analytics &amp; Forcasting
        </div>
        <h1 className="heading">Reports</h1>
        <p className="hero-blurb">
          Generate, export, and print reports on the details, borrowers, and
          overall performance of your small business.
        </p>
      </div>
      <div className="reports-page">
        <OverviewTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as ReportsTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="reports-panels reports-tab-change"
        >
          {tab === "reports" && <ReportsPanel />}
        </div>
      </div>
    </div>
  );
}
