import React from "react";
import { useSearchParams } from "react-router-dom";
import PageTabs, { type TabDefinition } from "../components/PageTabs";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import "./AbstractPage.css";
import "./ResourcesPage.css";
import ResourcesPanel from "../components/panels/ResourcesPanel";

export type ResourcesTabKey = "resources";

export default function SettingsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab =
    (searchParams.get("tab") as ResourcesTabKey) || "resources";
  const [tab, setTab] = React.useState<ResourcesTabKey>(defaultTab);

  const tabs: TabDefinition[] = [
    { key: "resources" as any, icon: faCoins, label: "Resources" },
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
    const next = (searchParams.get("tab") as ResourcesTabKey) || "resources";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="hero-content">
        <div className="preheading">Education &amp; Learning</div>
        <h1 className="heading">Resources</h1>
        <p className="hero-blurb">
          Resources to help understand your financing options, the repayment
          process, and your financial health.
        </p>
      </div>
      <div className="resources-page">
        <PageTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as ResourcesTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="page-panels page-tab-change"
        >
          {tab === "resources" && <ResourcesPanel />}
        </div>
      </div>
    </div>
  );
}
