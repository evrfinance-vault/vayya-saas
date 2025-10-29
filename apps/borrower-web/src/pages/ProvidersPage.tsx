import React from "react";
import { useSearchParams } from "react-router-dom";
import PageTabs, { type TabDefinition } from "../components/PageTabs";
import { faSitemap } from "@fortawesome/free-solid-svg-icons";
import "./AbstractPage.css";
import "./ProvidersPage.css";
import ProvidersPanel from "../components/panels/ProvidersPanel";

export type ProvidersTabKey = "providers";

export default function ProvidersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab =
    (searchParams.get("tab") as ProvidersTabKey) || "providers";
  const [tab, setTab] = React.useState<ProvidersTabKey>(defaultTab);

  const tabs: TabDefinition[] = [
    { key: "providers" as any, icon: faSitemap, label: "Providers" },
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
    const next = (searchParams.get("tab") as ProvidersTabKey) || "providers";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="hero-content">
        <div className="preheading">Business Directory</div>
        <h1 className="heading">Providers</h1>
        <p className="hero-blurb">
          Find other businesses in the same sector as your current loan that
          also offer EvR financing.
        </p>
      </div>
      <div className="providers-page">
        <PageTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as ProvidersTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="page-panels page-tab-change"
        >
          {tab === "providers" && <ProvidersPanel />}
        </div>
      </div>
    </div>
  );
}
