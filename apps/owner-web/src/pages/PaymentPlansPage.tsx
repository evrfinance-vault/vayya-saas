import React from "react";
import { useSearchParams } from "react-router-dom";
import OverviewTabs, { type TabDef } from "../components/OverviewTabs";
import { faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import "./OverviewPage.css";
import "./PaymentPlansPage.css";
import { PaymentPlansPanel } from "../components/panels";

export type PaymentPlansTabKey = "plans";

export default function PaymentPlansPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as PaymentPlansTabKey) || "plans";
  const [tab, setTab] = React.useState<PaymentPlansTabKey>(defaultTab);

  const tabs: TabDef[] = [
    { key: "plans" as any, icon: faCheckDouble, label: "Financing Options" },
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
    const next = (searchParams.get("tab") as PaymentPlansTabKey) || "plans";
    if (next !== tab) setTab(next);
  }, [tab, searchParams]);

  return (
    <div className="page-content">
      <div className="overview-hero">
        <div className="preheading" style={{ fontSize: "small" }}>
          Borrower Financing
        </div>
        <h1 className="heading">Payment Plans</h1>
        <p className="hero-blurb">
          Create a new payment plan with in-house or Kayya-backed financing, or
          perform a one time transaction.
        </p>
      </div>
      <div className="payment-plans-page">
        <OverviewTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as PaymentPlansTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="payment-plans-panels payment-plans-tab-change"
        >
          {tab === "plans" && <PaymentPlansPanel />}
        </div>
      </div>
    </div>
  );
}
