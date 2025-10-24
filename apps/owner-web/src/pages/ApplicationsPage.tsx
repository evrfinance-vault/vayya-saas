import React from "react";
import { useSearchParams } from "react-router-dom";
import OverviewTabs, { type TabDef } from "../components/OverviewTabs";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";
import "./OverviewPage.css";
import "./ApplicationsPage.css";
import { ApplicationsPanel } from "../components/panels";
import { useApplicationsSummary } from "../api/useApplications";

export type ApplicationsTabKey = "applications";

const TABS: TabDef[] = [
  {
    key: "applications" as any,
    icon: faFileLines,
    label: "Total Applications",
  },
];

export default function ApplicationsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab =
    (searchParams.get("tab") as ApplicationsTabKey) || "applications";
  const [tab, setTab] = React.useState<ApplicationsTabKey>(defaultTab);

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
    const next =
      (searchParams.get("tab") as ApplicationsTabKey) || "applications";
    setTab(next);
  }, [setTab, searchParams]);

  const { data: summary } = useApplicationsSummary();

  const tabs = React.useMemo(
    () =>
      TABS.map((t) =>
        t.key === "applications"
          ? {
              ...t,
              badge: String(summary?.totalApplications ?? 0),
            }
          : t,
      ),
    [summary],
  );

  return (
    <div className="page-content">
      <div className="overview-hero">
        <div className="preheading" style={{ fontSize: "small" }}>
          Potential Borrowers
        </div>
        <h1 className="heading">Applications</h1>
        <p className="hero-blurb">
          View, manage, and approve or deny the applications of potential
          borrowers for your small business.
        </p>
      </div>
      <div className="applications-page">
        <OverviewTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as ApplicationsTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="applications-panels applications-tab-change"
        >
          {tab === "applications" && <ApplicationsPanel />}
        </div>
      </div>
    </div>
  );
}
