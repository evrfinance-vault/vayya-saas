import React from "react";
import { useSearchParams } from "react-router-dom";
import OverviewTabs, { type TabDef } from "../components/OverviewTabs";
import { faBriefcase, faGears } from "@fortawesome/free-solid-svg-icons";
import "./OverviewPage.css";
import "./SettingsPage.css";
import {
  SettingsAccountPanel,
  DiscoveryProfilePanel,
} from "../components/panels";

export type SettingsTabKey = "settings" | "discovery";

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as SettingsTabKey) || "discovery";
  const [tab, setTab] = React.useState<SettingsTabKey>(defaultTab);

  const tabs: TabDef[] = [
    { key: "discovery" as any, icon: faBriefcase, label: "Discovery Profile" },
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
    const next = (searchParams.get("tab") as SettingsTabKey) || "discovery";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="overview-hero">
        <div className="preheading" style={{ fontSize: "small" }}>
          Business Info & Login Details
        </div>
        <h1 className="heading">Settings</h1>
        <p className="hero-blurb">
          Fill out your Discovery Profile with information about your small
          business, or change your login name and email address.
        </p>
      </div>
      <div className="settings-page">
        <OverviewTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as SettingsTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="settings-panels settings-tab-change"
        >
          {tab === "discovery" && <DiscoveryProfilePanel />}
          {tab === "settings" && <SettingsAccountPanel />}
        </div>
      </div>
    </div>
  );
}
