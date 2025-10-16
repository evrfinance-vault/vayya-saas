import React from "react";
import {
  faBuildingColumns,
  faPiggyBank,
  faClockRotateLeft,
  faPercent,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import InfoCard from "../cards/InfoCard";
import SpreadsheetCard from "../cards/SpreadsheetCard";
import {
  useActivePlans,
  type RangeKey,
  type PlanKey,
  type ActivePlanRow,
  fmtUSD,
  fmtAPR,
} from "../../api/useActivePlans";

type StatusKey = "ALL" | "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";

type TableRow = {
  id: string;
  client: string;
  amount: string;
  outstanding: string;
  apr: string;
  term: string;
  progress: string;
  status: string;
  planType: string;
};

export default function ActivePaymentPlansPanel(): React.ReactElement {
  const [range, setRange] = React.useState<RangeKey>("ytd");
  const [plan, setPlan] = React.useState<PlanKey>("ALL");
  const [status, setStatus] = React.useState<StatusKey>("ALL");

  const { rows: raw, summary, loading } = useActivePlans(range, status, plan);

  const rows: TableRow[] = React.useMemo(() => {
    return raw.map((r) => ({
      id: r.id,
      client: r.client,
      amount: fmtUSD(r.amountCents),
      outstanding: fmtUSD(r.outstandingCents),
      apr: fmtAPR(r.aprBps),
      term: `${r.termMonths} mo`,
      progress: r.progressPct,
      status: r.status,
      planType: r.planType === "KAYYA" ? "Kayya-Backed" : "Self-Financed",
    }));
  }, [raw]);

  const shortId = (s: string) =>
    s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;

  const progressRenderer = (row: { progressPct: number }) => {
    const pct = Math.max(0, Math.min(100, Number(row.progress) || 0));
    const color =
      pct >= 90 ? "var(--alt-theme-color)"
      : pct >= 75 ? "var(--theme-color)"
      : pct >= 50 ? "var(--fair-health-color)"
      : "var(--poor-health-color)";

    return (
      <div className="ss-progress" style={{ ["--pct" as any]: `${pct}%`, ["--bar" as any]: color }}>
        <span />
        <div className="label">{pct.toFixed(1)}%</div>
      </div>
    );
  };

  const statusRenderer = (row: { status: "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID" }) => {
    const COLORS: Record<typeof row.status, string> = {
      PAID: "var(--alt-theme-color)",
      ACTIVE: "var(--theme-color)",
      HOLD: "var(--fair-health-color)",
      DELINQUENT: "var(--poor-health-color)"
    };
    const label =
      row.status === "PAID" ? "Paid" :
      row.status === "ACTIVE" ? "Active" :
      row.status === "HOLD" ? "Hold" : "Delinquent";

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
      <InfoCard
        title="Total Financed"
        icon={faBuildingColumns}
        value={(summary?.totalFinancedCents ?? 0) / 100}
        kind="money"
        subtext="Lifetime volume"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Interest Earned"
        icon={faPiggyBank}
        value={(summary?.interestEarnedYtdCents ?? 0) / 100}
        kind="money"
        subtext="Year-to-date"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Outstanding"
        icon={faClockRotateLeft}
        value={(summary?.outstandingCents ?? 0) / 100}
        kind="money"
        subtext="Total balance"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Avg APR"
        icon={faPercent}
        value={Number(((summary?.avgAprBps ?? 0) / 100).toFixed(2))}
        kind="percent"
        subtext="Weighted average"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<TableRow>
        title="Active Loans Overview"
        icon={faList}
        columns={[
          {
            key: "id",
            label: "Loan ID",
            width: "128px",
            render: (r) => <span title={r.id}>{shortId(r.id)}</span>,
          },
          { key: "client", label: "Borrower", width: "minmax(180px, 1.3fr)" },
          {
            key: "amount",
            label: "Amount",
            width: "110px",
            align: "right",
          },
          {
            key: "outstanding",
            label: "Outstanding",
            width: "120px",
            align: "right",
          },
          {
            key: "apr",
            label: "APR",
            width: "72px",
            align: "right",
          },
          {
            key: "term",
            label: "Term",
            width: "84px",
            align: "center",
          },
          {
            key: "progress",
            label: "Progress",
            width: "110px",
            align: "center",
            render: progressRenderer as any,
          },
          {
            key: "status",
            label: "Status",
            width: "104px",
            align: "center",
            render: statusRenderer as any,
          },
          {
            key: "planType",
            label: "Type",
            width: "88px",
            align: "center",
            render: (r) => (r.planType === "Kayya-Backed" ? "Kayya" : "Self"),
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
