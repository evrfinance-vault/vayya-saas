import React from "react";
import {
  faBuildingColumns,
  faCircleCheck,
  faInfo,
  faDollarSign,
  faList,
  faPiggyBank,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import InfoCard from "../cards/InfoCard";
import NoticeCard from "../cards/NoticeCard";
import SpreadsheetCard from "../cards/SpreadsheetCard";

type Row = {
  month: string;
  interest: string;
  fees: string;
  total: string;
  volume: string;
  repayRate: string;
  platformFees: string;
};

const rows: Row[] = [
  {
    month: "October 2025",
    interest: "$45,280.50",
    fees: "$3,200.00",
    total: "$48,480.50",
    volume: "$82,000.00",
    repayRate: "94.5%",
    platformFees: "$2,424.03",
  },
  {
    month: "September 2025",
    interest: "$42,100.25",
    fees: "$2,950.00",
    total: "$45,050.25",
    volume: "$78,000.00",
    repayRate: "95.2%",
    platformFees: "$2,252.51",
  },
  // …
];

export default function TotalRevenuePanel() {
  return (
    <div className="overview-grid">
      <InfoCard
        title="Total Revenue (YTD)"
        icon={faDollarSign}
        iconColor="var(--theme-color)"
        value={256932.25}
        kind="money"
        subtext="+18.5% from last year"
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

      <NoticeCard
        backgroundColor="var(--unread-color)"
        title="Kayya platform fees: $12,846.62 (5% of revenue)"
        titleColor="var(--light-color)"
        icon={faInfo}
        iconColor="var(--light-color)"
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
      />
    </div>
  );
}
