import React from "react";
import "./OverviewPage.css";
import { useGreeting, useDateStamp, UserBadge } from "@packages/ui-auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faMoneyBillTrendUp,
  faGrip,
  faSackDollar,
  faSackXmark,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useSearchParams } from "react-router-dom";
import OverviewTabs, { TabKey, TabDef } from "../components/OverviewTabs";
import {
  ActivePaymentPlansPanel,
  LatePaymentsPanel,
  PendingApplicationsPanel,
  TotalRevenuePanel,
  BoardPanel,
} from "../components/panels";

const tinydot: React.CSSProperties = {
  fontSize: "x-small",
  color: "lightgreen",
  marginRight: 3,
};

const TABS: TabDef[] = [
  {
    key: "total-revenue",
    icon: faMoneyBillTrendUp,
    label: "Total Revenue",
    badge: "$0,000.00",
  },
  {
    key: "active-payment-plans",
    icon: faSackDollar,
    label: "Active Payment Plans",
    badge: "0",
  },
  { key: "kayya-board", icon: faGrip, label: "Kayya Board", badge: "~" },
  {
    key: "late-payments",
    icon: faSackXmark,
    label: "Late Payments",
    badge: "0",
  },
  {
    key: "pending-applications",
    icon: faSpinner,
    label: "Pending Applications",
    badge: "0",
  },
];

export default function OverviewPage(): React.ReactElement {
  const greeting = useGreeting();
  const today = useDateStamp();

  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as TabKey) || "kayya-board";
  const [tab, setTab] = React.useState<TabKey>(defaultTab);

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

  return (
    <div
      className="page-content"
      style={{
        padding: 24,
        marginLeft: 12,
        marginRight: 12,
        marginTop: 24,
        marginBottom: 24,
        display: "grid",
        gap: 0,
      }}
    >
      <div className="overview-hero">
        <div className="preheading" style={{ fontSize: "small" }}>
          <span style={tinydot}>
            <FontAwesomeIcon icon={faCircle} />
          </span>
          Live Dashboard • {today}
        </div>

        <h1 className="heading">
          {greeting}, <UserBadge />
        </h1>

        <p className="hero-blurb">
          Kayya is an innovative financing platform that allows businesses
          in elective health care to offer in-house financing to their patients.
        </p>
      </div>

      <section className="page-overview">
        <OverviewTabs tabs={TABS} value={tab} onChange={setTab} />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="overview-panel overview-tab-change"
        >
          {tab === "active-payment-plans" && <ActivePaymentPlansPanel />}
          {tab === "late-payments" && <LatePaymentsPanel />}
          {tab === "pending-applications" && <PendingApplicationsPanel />}
          {tab === "total-revenue" && <TotalRevenuePanel />}
          {tab === "kayya-board" && <BoardPanel />}
        </div>
      </section>
    </div>
  );
}
