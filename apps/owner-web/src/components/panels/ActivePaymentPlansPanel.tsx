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
  const [range, setRange] = React.useState<RangeKey>("12m");
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
      progress: `${Math.round(r.progressPct)}%`,
      status: labelForStatus(r.status),
      planType: r.planType === "KAYYA" ? "Kayya-Backed" : "Self-Financed",
    }));
  }, [raw]);

  const shortId = (s: string) =>
    s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;

  return (
    <div className="overview-grid" aria-busy={loading}>
      <InfoCard
        title="Total Financed"
        icon={faBuildingColumns}
        iconColor="var(--theme-color)"
        value={(summary?.totalFinancedCents ?? 0) / 100}
        kind="money"
        subtext="Lifetime volume"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Interest Earned"
        icon={faPiggyBank}
        iconColor="var(--theme-color)"
        value={(summary?.interestEarnedYtdCents ?? 0) / 100}
        kind="money"
        subtext="Year to date"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Outstanding"
        icon={faClockRotateLeft}
        iconColor="var(--theme-color)"
        value={(summary?.outstandingCents ?? 0) / 100}
        kind="money"
        subtext="Total balance"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Avg APR"
        icon={faPercent}
        iconColor="var(--theme-color)"
        value={Number(((summary?.avgAprBps ?? 0) / 100).toFixed(2))}
        kind="percent"
        subtext="Weighted average"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<TableRow>
        title="Active Loans Overview"
        icon={faList}
        iconColor="var(--theme-color)"
        columns={[
          {
            key: "id",
            label: "Loan ID",
            width: "128px",
            render: (r) => <span title={r.id}>{shortId(r.id)}</span>,
          },
          { key: "client", label: "Patient", width: "minmax(180px, 1.3fr)" },
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
          },
          {
            key: "status",
            label: "Status",
            width: "104px",
            align: "center",
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
        onRangeChange={setRange}
        planValue={plan}
        onPlanChange={setPlan}
        statusValue={status}
        onStatusChange={setStatus}
        showStatusFilter
      />
    </div>
  );
}

function labelForStatus(s: ActivePlanRow["status"]): string {
  switch (s) {
    case "ACTIVE":
      return "active";
    case "HOLD":
      return "on hold";
    case "DELINQUENT":
      return "delinquent";
    case "PAID":
      return "paid";
    default:
      return String(s).toLowerCase();
  }
}
