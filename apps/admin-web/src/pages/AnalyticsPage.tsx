import React from "react";
import { useSearchParams } from "react-router-dom";
import PageTabs, { type TabDefinition } from "../components/PageTabs";
import { faChartSimple } from "@fortawesome/free-solid-svg-icons";
import "./AbstractPage.css";
import "./AnalyticsPage.css";
import AnalyticsPanel from "../components/panels/AnalyticsPanel";

export type AnalyticsTabKey = "analytics";

export default function AnalyticsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab =
    (searchParams.get("tab") as AnalyticsTabKey) || "analytics";
  const [tab, setTab] = React.useState<AnalyticsTabKey>(defaultTab);

  const tabs: TabDefinition[] = [
    { key: "analytics" as any, icon: faChartSimple, label: "Analytics" },
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
    const next = (searchParams.get("tab") as AnalyticsTabKey) || "analytics";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="hero-content">
        <div className="preheading">Activty &amp; Metrics</div>
        <h1 className="heading">Analytics</h1>
        <p className="hero-blurb">
          View key metrics on user activity, loan performance, and platform
          health.
        </p>
      </div>
      <div className="analytics-page">
        <PageTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as AnalyticsTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="page-panels page-tab-change"
        >
          {tab === "analytics" && <AnalyticsPanel />}
        </div>
      </div>
    </div>
  );
}
