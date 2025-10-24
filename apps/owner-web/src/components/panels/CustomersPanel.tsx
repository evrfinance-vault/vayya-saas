import React from "react";
import SpreadsheetCard from "../cards/SpreadsheetCard";
import { faList } from "@fortawesome/free-solid-svg-icons";
import {
  useActivePlans,
  type RangeKey,
  type PlanKey,
  fmtUSD,
} from "../../api/useActivePlans";

type StatusKey = "ALL" | "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";

type TableRow = {
  client: string;
  amount: string;
  progress: number;
  status: "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";
};

export default function CustomersPanel(): React.ReactElement {
  const [range, setRange] = React.useState<RangeKey>("ltd");
  const [plan, setPlan] = React.useState<PlanKey>("ALL");
  const [status, setStatus] = React.useState<StatusKey>("ALL");

  const { rows: raw, summary: _summary, loading } = useActivePlans(range, status, plan);

  const rows: TableRow[] = React.useMemo(() => {
    return raw.map((r) => ({
      client: r.client,
      amount: fmtUSD(r.amountCents),
      progress: r.progressPct,
      status: r.status,
    }));
  }, [raw]);

  const progressRenderer = (row: TableRow) => {
    const pct = Math.max(0, Math.min(100, row.progress || 0));
    const color =
      pct >= 90
        ? "var(--alt-theme-color)"
        : pct >= 75
          ? "var(--theme-color)"
          : pct >= 50
            ? "var(--fair-health-color)"
            : "var(--poor-health-color)";

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
    status: "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";
  }) => {
    const COLORS: Record<typeof row.status, string> = {
      PAID: "var(--alt-theme-color)",
      ACTIVE: "var(--theme-color)",
      HOLD: "var(--fair-health-color)",
      DELINQUENT: "var(--poor-health-color)",
    };
    const label =
      row.status === "PAID"
        ? "Paid"
        : row.status === "ACTIVE"
          ? "Active"
          : row.status === "HOLD"
            ? "Hold"
            : "Delinquent";

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
    <div className="overview-grid" aria-busy={loading}>
      <SpreadsheetCard<TableRow>
        title="Borrowers with Payment Plans"
        icon={faList}
        columns={[
          { key: "client", label: "Borrower", width: "minmax(180px, 1.3fr)" },
          {
            key: "amount",
            label: "Amount",
            align: "right",
          },
          {
            key: "progress",
            label: "Progress",
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
        onRangeChange={(v) => setRange(v as typeof range)}
        planValue={plan}
        onPlanChange={setPlan}
        statusValue={status}
        onStatusChange={(s) => setStatus(s as typeof status)}
        showStatusFilter
        rangeOptions={["all", "ytd", "12m", "6m", "3m"]}
        planOptions={["ALL", "KAYYA", "SELF"]}
      />
    </div>
  );
}
