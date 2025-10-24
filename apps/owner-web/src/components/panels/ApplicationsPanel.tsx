import React from "react";
import { faList } from "@fortawesome/free-solid-svg-icons";
import SpreadsheetCard from "../cards/SpreadsheetCard";
import {
  useApplications,
  fmtUSD,
  type AppPlan,
  type AppStatus,
} from "../../api/useApplications";

type Row = {
  client: string;
  amount: string;
  completion: number;
  status: string;
};

function percentage(status: string) {
  switch (status) {
    case "PENDING":
      return 25;
    case "PAID":
      return 50;
    case "CONTACTED":
      return 75;
    case "FAILED":
    case "DONE":
      return 100;
    case "SENT":
    default:
      return 0;
  }
}

export default function ApplicationsPanel() {
  const [range, setRange] = React.useState<"all" | "30d" | "90d" | "ytd">(
    "all",
  );
  const [status, setStatus] = React.useState<AppStatus>("ALL");
  const [plan, setPlan] = React.useState<AppPlan>("ALL");

  const { rows: apps } = useApplications(range, status, plan);

  const rows: Row[] = React.useMemo(() => {
    if (!apps) return [];
    return apps.map((a) => ({
      client: a.client,
      amount: fmtUSD(a.amountCents),
      type: a.planType === "KAYYA" ? "Kayya-backed" : "Self-financed",
      credit: a.creditScore == null ? "—" : String(a.creditScore),
      completion: percentage(a.status),
      status: a.status,
      submitted: new Date(a.submittedAt).toLocaleDateString(),
    }));
  }, [apps]);

  const progressRenderer = (row: { completion: number; status: string }) => {
    const pct = Math.max(0, Math.min(100, row.completion || 0));
    const color =
      pct === 100 && row.status === "FAILED"
        ? "var(--poor-health-color)"
        : pct === 100
          ? "var(--alt-theme-color)"
          : pct >= 25 && pct <= 75
            ? "var(--theme-color)"
            : "var(--fair-health-color)";

    return (
      <div
        className="ss-progress"
        style={{ ["--pct" as any]: `${pct}%`, ["--bar" as any]: color }}
      >
        <span />
        <div className="label">{pct.toFixed(1)}%</div>
      </div>
    );
  };

  const statusRenderer = (row: {
    status: "SENT" | "FAILED" | "PENDING" | "PAID" | "CONTACTED" | "DONE";
  }) => {
    const COLORS: Record<typeof row.status, string> = {
      SENT: "var(--fair-health-color)",
      FAILED: "var(--poor-health-color)",
      PENDING: "var(--theme-color)",
      PAID: "var(--theme-color)",
      CONTACTED: "var(--theme-color)",
      DONE: "var(--alt-theme-color)",
    };
    const label =
      row.status.charAt(0).toUpperCase() + row.status.toLowerCase().slice(1);

    return (
      <span
        className="status-pill"
        style={{ ["--pill-bg" as any]: COLORS[row.status] }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="overview-grid">
      <SpreadsheetCard<Row>
        title="Potential Borrowers"
        icon={faList}
        columns={[
          { key: "client", label: "Borrower" },
          { key: "amount", label: "Amount", align: "right" },
          {
            key: "completion",
            label: "Completion",
            align: "center",
            render: progressRenderer as any,
          },
          {
            key: "status",
            label: "Status",
            align: "center",
            render: statusRenderer as any,
          },
        ]}
        rows={rows}
        width="4x"
        height="3x"
        rangeValue={range}
        onRangeChange={(r) => setRange(r as any)}
        rangeOptions={[
          { value: "all", label: "All time" },
          { value: "30d", label: "Last 30 days" },
          { value: "90d", label: "Last 90 days" },
          { value: "ytd", label: "Year to date" },
        ]}
        planValue={plan}
        onPlanChange={setPlan}
        planOptions={["ALL", "KAYYA", "SELF"]}
        statusValue={status}
        statusOptions={[
          "ALL",
          "SENT",
          "FAILED",
          "PENDING",
          "PAID",
          "CONTACTED",
          "DONE",
        ]}
        onStatusChange={(s) => setStatus(s as typeof status)}
      />
    </div>
  );
}
