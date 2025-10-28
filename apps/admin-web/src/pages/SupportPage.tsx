import React from "react";
import { useSearchParams } from "react-router-dom";
import PageTabs, { type TabDefinition } from "../components/PageTabs";
import { faLifeRing } from "@fortawesome/free-solid-svg-icons";
import "./AbstractPage.css";
import "./SupportPage.css";
import SupportPanel from "../components/panels/SupportPanel";

export type SupportTabKey = "support";

export default function SupportPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as SupportTabKey) || "support";
  const [tab, setTab] = React.useState<SupportTabKey>(defaultTab);

  const tabs: TabDefinition[] = [
    { key: "support" as any, icon: faLifeRing, label: "Support" },
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
    const next = (searchParams.get("tab") as SupportTabKey) || "support";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="hero-content">
        <div className="preheading">User Assistance</div>
        <h1 className="heading">Support</h1>
        <p className="hero-blurb">
          Resolve support requests, answer questions, and add to the platform
          knowledge base.
        </p>
      </div>
      <div className="support-page">
        <PageTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as SupportTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="page-panels page-tab-change"
        >
          {tab === "support" && <SupportPanel />}
        </div>
      </div>
    </div>
  );
}
