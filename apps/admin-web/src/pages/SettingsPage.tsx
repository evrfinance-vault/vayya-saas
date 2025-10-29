import React from "react";
import { useSearchParams } from "react-router-dom";
import PageTabs, { type TabDefinition } from "../components/PageTabs";
import { faGears } from "@fortawesome/free-solid-svg-icons";
import "./AbstractPage.css";
import "./SettingsPage.css";
import SettingsPanel from "../components/panels/SettingsPanel";

export type SettingsTabKey = "settings";

export default function SettingsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as SettingsTabKey) || "settings";
  const [tab, setTab] = React.useState<SettingsTabKey>(defaultTab);

  const tabs: TabDefinition[] = [
    { key: "settings" as any, icon: faGears, label: "Settings" },
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
    const next = (searchParams.get("tab") as SettingsTabKey) || "settings";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="hero-content">
        <div className="preheading">Login Details</div>
        <h1 className="heading">Settings</h1>
        <p className="hero-blurb">Change your login name and email address.</p>
      </div>
      <div className="settings-page">
        <PageTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as SettingsTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="page-panels page-tab-change"
        >
          {tab === "settings" && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}
