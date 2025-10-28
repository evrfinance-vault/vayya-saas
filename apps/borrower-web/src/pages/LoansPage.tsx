import React from "react";
import { useSearchParams } from "react-router-dom";
import PageTabs, { type TabDefinition } from "../components/PageTabs";
import { faBuildingColumns } from "@fortawesome/free-solid-svg-icons";
import "./AbstractPage.css";
import "./LoansPage.css";
import LoansPanel from "../components/panels/LoansPanel";

export type LoansTabKey = "loans";

export default function LoansPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as LoansTabKey) || "loans";
  const [tab, setTab] = React.useState<LoansTabKey>(defaultTab);

  const tabs: TabDefinition[] = [
    { key: "loans" as any, icon: faBuildingColumns, label: "Loans" },
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
    const next = (searchParams.get("tab") as LoansTabKey) || "loans";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="hero-content">
        <div className="preheading">Borrower Financing</div>
        <h1 className="heading">Loans</h1>
        <p className="hero-blurb">
          View and manage your loans and small business payment plans.
        </p>
      </div>
      <div className="loans-page">
        <PageTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as LoansTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="page-panels page-tab-change"
        >
          {tab === "loans" && <LoansPanel />}
        </div>
      </div>
    </div>
  );
}
