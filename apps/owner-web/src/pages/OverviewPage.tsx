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
import { useTotalRevenueSummary, fmtUSD } from "../api/useTotalRevenue";
import { useActivePlans } from "../api/useActivePlans";
import { useLatePaymentsSummary } from "../api/useLatePayments";
import { useApplicationsSummary } from "../api/useApplications";

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
  { key: "kayya-board", icon: faGrip, label: "Kayya Board", badge: "" },
  {
    key: "late-payments",
    icon: faSackXmark,
    label: "Missed/Late Payments",
    badge: "0",
  },
  {
    key: "pending-applications",
    icon: faSpinner,
    label: "Pending Applications",
    badge: "0",
  },
];

function useBackendHealth(pollingTimeInMS = 30000) {
  const apiBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const url = `${apiBase.replace(/\/$/, "")}/health`;
  const [ok, setOk] = React.useState<boolean | null>(null);

  const check = React.useCallback(async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      setOk(res.ok);
    } catch {
      setOk(false);
    }
  }, [url]);

  React.useEffect(() => {
    check();
    const id = setInterval(check, pollingTimeInMS);
    return () => clearInterval(id);
  }, [check, pollingTimeInMS]);

  return ok;
}

export default function OverviewPage(): React.ReactElement {
  const greeting = useGreeting();
  const today = useDateStamp();
  const health = useBackendHealth();

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

  const dotColor = health === null ? "#f2f2f2" : health ? "#90ee90" : "#edbf91";

  const { data: trSummary } = useTotalRevenueSummary();
  const { data: lpSummary } = useLatePaymentsSummary();
  const { data: apSummary } = useApplicationsSummary();

  const {
    rows: _raw,
    summary,
    loading: _loading,
  } = useActivePlans("ltd", "ALL", "ALL");

  const tabs = React.useMemo(
    () =>
      TABS.map((t) =>
        t.key === "total-revenue"
          ? {
              ...t,
              badge: fmtUSD(trSummary?.allTimeRevenueCents ?? 0),
            }
          : t.key === "active-payment-plans"
            ? {
                ...t,
                badge: String(summary?.activeCount ?? 0),
              }
            : t.key === "late-payments"
              ? {
                  ...t,
                  badge: String(lpSummary?.missedPaymentsTotal ?? 0),
                }
              : t.key === "pending-applications"
                ? {
                    ...t,
                    badge: String(apSummary?.pendingCount ?? 0),
                  }
                : t,
      ),
    [trSummary, summary, lpSummary, apSummary],
  );

  return (
    <div className="page-content">
      <div className="overview-hero">
        <div className="preheading" style={{ fontSize: "small" }}>
          <span
            title={
              health === null
                ? "Checking…"
                : health
                  ? "API healthy"
                  : "API unreachable"
            }
            aria-label={
              health === null
                ? "Checking back-end status"
                : health
                  ? "Back-end online"
                  : "Back-end offline"
            }
            style={{ fontSize: "x-small", color: dotColor, marginRight: 3 }}
          >
            <FontAwesomeIcon icon={faCircle} />
          </span>
          Live Dashboard • {today}
        </div>

        <h1 className="heading">
          {greeting}, <UserBadge />
        </h1>

        <p className="hero-blurb">
          Kayya is an innovative financing platform that allows businesses in
          elective health care to offer in-house financing to their patients.
        </p>
      </div>

      <section className="page-overview">
        <OverviewTabs tabs={tabs} value={tab} onChange={setTab} />
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
