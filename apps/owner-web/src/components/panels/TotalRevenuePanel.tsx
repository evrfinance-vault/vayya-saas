import React from "react";
import {
  faBuildingColumns,
  faCircleCheck,
  faDollarSign,
  faList,
  faPiggyBank,
  faArrowTrendUp,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import InfoCard from "../cards/InfoCard";
import SpreadsheetCard from "../cards/SpreadsheetCard";
import {
  useTotalRevenueSummary,
  useTotalRevenueMonthly,
  fmtUSD,
  type PlanKey,
} from "../../api/useTotalRevenue";

type Row = {
  month: string;
  interest: string;
  fees: string;
  total: string;
  volume: string;
  repayRate: string;
  platformFees: string;
  repaymentRatePct: number;
};

const fmtYoY = (pct: number) => {
  const abs = Math.abs(pct);
  const shown = abs >= 100 ? Math.round(pct) : Math.round(pct * 10) / 10;
  return `${shown.toLocaleString()}% from last year`;
};

export default function TotalRevenuePanel() {
  const [monthsBack, setMonthsBack] = React.useState<"ytd" | "12m" | "all">("ytd");
  const [plan, setPlan] = React.useState<PlanKey>("ALL");

  const { data: summary } = useTotalRevenueSummary();
  const { data: months } = useTotalRevenueMonthly(monthsBack, plan);

  const rows = React.useMemo(() => (months ?? []).map(m => ({
    month: m.label,
    interest: fmtUSD(m.interestCents),
    fees: fmtUSD(m.lateFeesCents),
    total: fmtUSD(m.revenueCents),
    volume: fmtUSD(m.loanVolumeCents),
    repayRate: `${m.repaymentRatePct.toFixed(1)}%`,
    platformFees: fmtUSD(m.platformFeesCents),
    repaymentRatePct: Number(m.repaymentRatePct ?? 0),
  })), [months]);

  const repayRenderer = (row: Row) => {
    const pct = Math.max(0, Math.min(100, row.repaymentRatePct || 0));
    const color = pct >= 90 ? "var(--alt-theme-color)" : pct >= 75 ? "var(--theme-color)" : pct >= 50 ? "var(--fair-health-color)" : "var(--poor-health-color)";

    return (
      <div className="ss-progress" style={{ ["--pct" as any]: `${pct}%`, ["--bar" as any]: color }}>
        <span />
        <div className="label">{pct.toFixed(1)}%</div>
      </div>
    );
  };

  return (
    <div className="overview-grid">
      <InfoCard
        title="Total Revenue (YTD)"
        icon={faDollarSign}
        value={(summary?.ytdRevenueCents ?? 0) / 100}
        valueColor="var(--dark-color)"
        kind="money"
        subtext={fmtYoY(summary?.yoyDeltaPct ?? 0)}
        subIcon={(summary?.yoyDeltaPct ?? 0) < 0 ? faArrowTrendDown : faArrowTrendUp}
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Interest Earned"
        icon={faPiggyBank}
        value={(summary?.interestYtdCents ?? 0) / 100}
        kind="money"
        subtext="Year-to-date"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Late Fees Collected"
        icon={faBuildingColumns}
        value={(summary?.lateFeesYtdCents ?? 0) / 100}
        kind="money"
        subtext="Year-to-date"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Avg Repayment Rate"
        icon={faCircleCheck}
        value={summary?.avgRepaymentRatePct ?? 0}
        kind="percent"
        subtext="Collection efficiency"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<Row>
        title="Monthly Revenue Summary"
        icon={faList}
        columns={[
          { key: "month", label: "Month", width: "180px" },
          { key: "interest", label: "Interest Earned", align: "right" },
          { key: "fees", label: "Fees Collected", align: "right" },
          { key: "total", label: "Total Revenue", align: "right" },
          { key: "volume", label: "Loan Volume", align: "right" },
          { key: "repayRate", label: "Repayment Rate", align: "center", render: repayRenderer as any },
          { key: "platformFees", label: "Platform Fees", align: "right" },
        ]}
        rows={rows}
        width="4x"
        height="3x"
        rangeValue={monthsBack}
        onRangeChange={(v) => setMonthsBack(v as any)}
        planValue={plan}
        onPlanChange={setPlan}
        rangeOptions={["all", "12m", "ytd"]}
        planOptions={["ALL", "KAYYA", "SELF"]}
      />
    </div>
  );
}
