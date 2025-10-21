import React from "react";
import {
  faExclamationTriangle,
  faSackDollar,
  faClipboardCheck,
  faClock,
  faList,
  faCaretDown,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import InfoCard from "../cards/InfoCard";
import SpreadsheetCard from "../cards/SpreadsheetCard";
import {
  useLatePaymentsSummary,
  useLatePayments,
  fmtUSD,
  type LateRow,
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

function titleCase(s: string) {
  return s ? s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function riskClass(risk: string) {
  switch (risk) {
    case "LOW":
      return "good";
    case "MEDIUM":
      return "warn";
    case "HIGH":
      return "danger";
    default:
      return "";
  }
}

export default function LatePaymentsPanel() {
  const { data: summary, loading } = useLatePaymentsSummary();

  const [status, setStatus] = React.useState<"ALL" | "LATE" | "HOLD">("ALL");
  const [risk, setRisk] = React.useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">(
    "ALL",
  );
  const [daysMin, setDaysMin] = React.useState(0);

  const { rows: raw } = useLatePayments({
    status: status,
    risk: risk,
    daysMin: daysMin,
  });

  const rows: Row[] = React.useMemo(() => {
    if (!raw) return [];
    const short = (id: string) => `LOAN-${id.slice(-3).toUpperCase()}`;
    return raw.map((r: LateRow) => ({
      acct: short(r.id),
      client: r.client,
      outstanding: fmtUSD(r.outstandingCents),
      overdue: fmtUSD(r.overdueCents),
      days: `${r.daysOverdue} days`,
      missed: String(r.missedPayments),
      risk: r.risk,
      status: r.status.toLowerCase(),
      type: r.planType === "KAYYA" ? "Kayya-backed" : "Self-financed",
    }));
  }, [raw]);

function riskClass(risk: string) {
    switch (risk) {
      case "LOW":
        return "good";
      case "MEDIUM":
        return "warn";
      case "HIGH":
        return "danger";
      default:
        return "";
    }
  }

  const riskRenderer = (row: {
    risk: "LOW" | "MEDIUM" | "HIGH";
  }) => {
    const COLORS: Record<typeof row.risk, string> = {
      LOW: "var(--theme-color)",
      MEDIUM: "var(--fair-health-color)",
      HIGH: "var(--poor-health-color)",
    };
    const label =
      row.risk === "HIGH"
        ? "High"
        : row.risk === "MEDIUM"
          ? "Medium"
          : "Low";

    return (
      <span
        className="status-pill"
        style={{ ["--pill-bg" as any]: COLORS[row.risk] }}
      >
        {label}
      </span>
    );
  };

  React.useEffect(() => {
    function handleExport(e: Event) {
      const ce = e as CustomEvent<{ key: string; type: "csv" | "pdf" | "print" }>;
      if (!ce.detail || ce.detail.key !== "late-payments") return;

      if (ce.detail.type === "csv") {
        const headers = [
          "Account",
          "Client",
          "Outstanding",
          "Amount Overdue",
          "Days Overdue",
          "Missed Payments",
          "Risk",
          "Status",
          "Type",
        ];
        const lines = rows.map((r) =>
          [
            r.acct,
            r.client,
            r.outstanding,
            r.overdue,
            r.days,
            r.missed,
            r.risk,
            titleCase(r.status),
            r.type,
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        );
        const csv = [headers.join(","), ...lines].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "late-payments.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Missed / Late Payments</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#111; padding:24px; }
    h1 { font-size:20px; margin:0 0 16px 0; }
    table { border-collapse: collapse; width:100%; font-size:12px; }
    th, td { border:1px solid #e5e7eb; padding:8px 10px; text-align:left; }
    th { background:#f9fafb; }
  </style>
</head>
<body>
  <h1>Missed / Late Payments</h1>
  <table>
    <thead>
      <tr>
        <th>Account</th>
        <th>Client</th>
        <th>Outstanding</th>
        <th>Amount Overdue</th>
        <th>Days Overdue</th>
        <th>Missed</th>
        <th>Risk</th>
        <th>Status</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `<tr>
          <td>${r.acct}</td>
          <td>${r.client}</td>
          <td>${r.outstanding}</td>
          <td>${r.overdue}</td>
          <td>${r.days}</td>
          <td>${r.missed}</td>
          <td>${r.risk}</td>
          <td>${titleCase(r.status)}</td>
          <td>${r.type}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <script>
    setTimeout(() => { window.print(); }, 50);
  </script>
</body>
</html>`;
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    }

    document.addEventListener("overview:export", handleExport as EventListener);
    return () =>
      document.removeEventListener("overview:export", handleExport as EventListener);
  }, [rows]);

  const headerControls = (
    <div className="ss-controls">
      <div className="ss-select-wrap">
        <select
          className="ss-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="ALL">All statuses</option>
          <option value="HOLD">Hold</option>
          <option value="LATE">Delinquent</option>
        </select>
        <FontAwesomeIcon icon={faCaretDown} className="ss-caret" />
      </div>

      <div className="ss-select-wrap">
        <select
          className="ss-select"
          value={risk}
          onChange={(e) => setRisk(e.target.value as any)}
        >
          <option value="ALL">All risk levels</option>
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
          <option value="0">Any days overdue</option>
          <option value="15">15 days overdue</option>
          <option value="30">30 days overdue</option>
          <option value="45">45 days overdue</option>
          <option value="60">60+ days overdue</option>
        </select>
        <FontAwesomeIcon icon={faCaretDown} className="ss-caret" />
      </div>
    </div>
  );

  return (
    <div className="overview-grid" aria-busy={loading}>
      <InfoCard
        title="Delinquent Accounts"
        icon={faExclamationTriangle}
        value={summary?.delinquentAccounts ?? 0}
        kind="number"
        subtext={`${summary?.newDelinquentAccounts ?? 0} new this week`}
        subIcon={faArrowTrendUp}
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Amount Overdue"
        icon={faSackDollar}
        value={(summary?.amountOverdueCents ?? 0) / 100}
        kind="money"
        subtext="Immediate collection"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="At Risk Amount"
        icon={faClipboardCheck}
        value={(summary?.atRiskCents ?? 0) / 100}
        kind="money"
        subtext="Outstanding balance"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Avg Time Overdue"
        icon={faClock}
        value={summary?.avgDaysOverdue ?? 0}
        kind="number"
        subtext="Days"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<Row>
        title="Delinquent Accounts Overview"
        icon={faList}
        headerControls={headerControls}
        columns={[
          { key: "client", label: "Borrower", width: "minmax(180px, 1.3fr)" },
          {
            key: "outstanding",
            label: "Outstanding",
            align: "right",
          },
          {
            key: "overdue",
            label: "Amount Overdue",
            align: "right",
          },
          {
            key: "days",
            label: "Days Overdue",
            align: "center",
          },
          {
            key: "missed",
            label: "Missed Payments",
            align: "center",
          },
          {
            key: "risk",
            label: "Risk Level",
            align: "center",
            render: riskRenderer as any,
          },
          { key: "type", label: "Type", align: "center" },
        ]}
        rows={rows}
        width="4x"
        height="3x"
      />
    </div>
  );
}
