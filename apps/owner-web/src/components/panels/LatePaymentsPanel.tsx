import React from "react";
import {
  faExclamationTriangle,
  faSackDollar,
  faClipboardCheck,
  faClock,
  faList,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import InfoCard from "../cards/InfoCard";
import SpreadsheetCard from "../cards/SpreadsheetCard";
import {
  useLatePaymentsSummary,
  useLatePaymentsRows,
  fmtUSD,
  type LPRow,
} from "../../api/useLatePayments";

type Row = {
  acct: string;
  client: string;
  outstanding: string;
  overdue: string;
  days: string;
  missed: string;
  risk: string;
  status: string;
  type: string;
};

export default function LatePaymentsPanel() {
  const { data: summary } = useLatePaymentsSummary();

  const [status, setStatus] = React.useState<"ALL" | "LATE" | "HOLD">("ALL");
  const [risk, setRisk] = React.useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">(
    "ALL",
  );
  const [daysMin, setDaysMin] = React.useState(0);

  const { rows: raw } = useLatePaymentsRows(status, risk, daysMin);

  const rows: Row[] = React.useMemo(() => {
    if (!raw) return [];
    const short = (id: string) => `LOAN-${id.slice(-3).toUpperCase()}`;
    const pill = (t: string) => t;
    return raw.map((r: LPRow) => ({
      acct: short(r.id),
      client: r.client,
      outstanding: fmtUSD(r.outstandingCents),
      overdue: fmtUSD(r.overdueCents),
      days: `${r.daysOverdue} days`,
      missed: String(r.missedPayments),
      risk: pill(r.risk),
      status: pill(r.status.toLowerCase()),
      type: r.planType === "KAYYA" ? "Kayya-backed" : "Self-financed",
    }));
  }, [raw]);

  const headerControls = (
    <div className="ss-controls">
      {/* Status */}
      <div className="ss-select-wrap">
        <select
          className="ss-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="ALL">All status</option>
          <option value="LATE">Late</option>
          <option value="HOLD">On hold</option>
        </select>
        <FontAwesomeIcon icon={faCaretDown} className="ss-caret" />
      </div>

      <div className="ss-select-wrap">
        <select
          className="ss-select"
          value={risk}
          onChange={(e) => setRisk(e.target.value as any)}
        >
          <option value="ALL">All risk</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <FontAwesomeIcon icon={faCaretDown} className="ss-caret" />
      </div>

      <div className="ss-select-wrap">
        <select
          className="ss-select"
          value={String(daysMin)}
          onChange={(e) => setDaysMin(Number(e.target.value))}
        >
          <option value="0">All days</option>
          <option value="15">15+ days</option>
          <option value="30">30+ days</option>
          <option value="45">45+ days</option>
          <option value="60">60+ days</option>
        </select>
        <FontAwesomeIcon icon={faCaretDown} className="ss-caret" />
      </div>
    </div>
  );

  return (
    <div className="overview-grid">
      <InfoCard
        title="Delinquent Accounts"
        icon={faExclamationTriangle}
        iconColor="var(--theme-color)"
        value={summary?.delinquentAccounts ?? 0}
        kind="number"
        subtext="+ this week"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Amount Overdue"
        icon={faSackDollar}
        iconColor="var(--theme-color)"
        value={(summary?.amountOverdueCents ?? 0) / 100}
        kind="money"
        subtext="Immediate collection"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="At Risk Amount"
        icon={faClipboardCheck}
        iconColor="var(--theme-color)"
        value={(summary?.atRiskCents ?? 0) / 100}
        kind="money"
        subtext="Outstanding balance"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Avg Days Overdue"
        icon={faClock}
        iconColor="var(--theme-color)"
        value={summary?.avgDaysOverdue ?? 0}
        kind="number"
        subtext="Days"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<Row>
        title="Delinquent Accounts Overview"
        icon={faList}
        iconColor="var(--theme-color)"
        headerControls={headerControls}
        columns={[
          { key: "acct", label: "Account", width: "130px" },
          { key: "client", label: "Client / Business", width: "280px" },
          {
            key: "outstanding",
            label: "Outstanding",
            align: "right",
            width: "150px",
          },
          {
            key: "overdue",
            label: "Amount Overdue",
            align: "right",
            width: "160px",
          },
          {
            key: "days",
            label: "Days Overdue",
            align: "center",
            width: "130px",
          },
          {
            key: "missed",
            label: "Missed Payments",
            align: "center",
            width: "140px",
          },
          { key: "risk", label: "Risk Level", align: "center", width: "120px" },
          { key: "status", label: "Status", align: "center", width: "100px" },
          { key: "type", label: "Type", align: "center", width: "140px" },
        ]}
        rows={rows}
        width="4x"
        height="3x"
      />
    </div>
  );
}
