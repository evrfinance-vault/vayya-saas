import React from "react";
import {
  faBuildingColumns,
  faCircleCheck,
  faDollarSign,
  faList,
  faPiggyBank,
  faArrowTrendUp,
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
};

export default function TotalRevenuePanel() {
  const [monthsBack, setMonthsBack] = React.useState<
    "3m" | "6m" | "12m" | "ltd"
  >("12m");
  const [plan, setPlan] = React.useState<PlanKey>("ALL");

  const { data: summary } = useTotalRevenueSummary();
  const { data: months } = useTotalRevenueMonthly(monthsBack, plan);

  const rows: Row[] = React.useMemo(() => {
    if (!months) return [];
    return months.map((m) => ({
      month: m.label,
      interest: "—",
      fees: "—",
      total: fmtUSD(m.revenueCents),
      volume: fmtUSD(m.loanVolumeCents),
      repayRate: `${m.repaymentRatePct.toFixed(1)}%`,
      platformFees: fmtUSD(m.platformFeesCents),
    }));
  }, [months]);

  return (
    <div className="overview-grid">
      <InfoCard
        title="Total Revenue (YTD)"
        icon={faDollarSign}
        iconColor="var(--theme-color)"
        value={(summary?.ytdRevenueCents ?? 0) / 100}
        kind="money"
        subtext={`${(summary?.yoyDeltaPct ?? 0).toFixed(1)}%`}
        subIcon={faArrowTrendUp}
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Interest Earned"
        icon={faPiggyBank}
        iconColor="var(--theme-color)"
        value={239532.25}
        kind="money"
        subtext="93.2% of revenue"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Fees Collected"
        icon={faBuildingColumns}
        iconColor="var(--theme-color)"
        value={17400}
        kind="money"
        subtext="Processing & late fees"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Avg Repayment Rate"
        icon={faCircleCheck}
        iconColor="var(--theme-color)"
        value={94.4}
        kind="percent"
        subtext="Collection efficiency"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<Row>
        title="Monthly Revenue Summary"
        icon={faList}
        iconColor="var(--theme-color)"
        columns={[
          { key: "month", label: "Month", width: "180px" },
          { key: "interest", label: "Interest Earned", align: "right" },
          { key: "fees", label: "Fees Collected", align: "right" },
          { key: "total", label: "Total Revenue", align: "right" },
          { key: "volume", label: "Loan Volume", align: "right" },
          { key: "repayRate", label: "Repayment Rate", align: "center" },
          { key: "platformFees", label: "Platform Fees", align: "right" },
        ]}
        rows={rows}
        width="4x"
        height="3x"
        rangeValue={monthsBack}
        onRangeChange={setMonthsBack}
        planValue={plan}
        onPlanChange={setPlan}
        rangeOptions={["3m", "6m", "12m", "ltd"]}
        planOptions={["ALL", "SELF", "KAYYA"]}
      />
    </div>
  );
}
