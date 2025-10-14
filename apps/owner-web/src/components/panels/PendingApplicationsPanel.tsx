import React from "react";
import {
  faClipboardList,
  faClock,
  faCheckCircle,
  faDollarSign,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import InfoCard from "../cards/InfoCard";
import SpreadsheetCard from "../cards/SpreadsheetCard";
import {
  useApplications,
  useApplicationsSummary,
  fmtUSD,
  type AppPlan,
  type AppStatus,
} from "../../api/useApplications";

type Row = {
  id: string;
  shortId: string;
  client: string;
  amount: string;
  type: string;
  credit: string;
  completion: string;
  status: string;
  submitted: string;
  actions: string;
};

function pct(n: number) {
  return `${Math.round(n)}%`;
}

export default function PendingApplicationsPanel() {
  const { data: summary } = useApplicationsSummary();

  const [range, setRange] = React.useState<"all" | "30d" | "90d" | "ytd">(
    "all",
  );
  const [status, setStatus] = React.useState<AppStatus>("ALL");
  const [plan, setPlan] = React.useState<AppPlan>("ALL");

  const { rows: apps } = useApplications(range, status, plan);

  const rows: Row[] = React.useMemo(() => {
    if (!apps) return [];
    return apps.map((a) => ({
      id: a.id,
      shortId: a.shortId,
      client: `${a.clientFirst} ${a.clientLast}`,
      amount: fmtUSD(a.amountCents),
      type: a.type === "KAYYA" ? "Vault" : "In-House",
      credit: a.creditScore == null ? "—" : String(a.creditScore),
      completion: pct(a.completionPct ?? 0),
      status: a.status.toLowerCase(),
      submitted: new Date(a.submittedAt).toLocaleDateString(),
      actions: "👁️",
    }));
  }, [apps]);

  return (
    <div className="overview-grid">
      <InfoCard
        title="Total Applications"
        icon={faClipboardList}
        iconColor="var(--alt-theme-color)"
        value={summary?.totalApplications ?? 0}
        kind="number"
        subtext="+23% this week"
        width="1x"
        height="05x"
      />
      <InfoCard
        title="Pending Review"
        icon={faClock}
        iconColor="var(--alt-theme-color)"
        value={summary?.pendingReviewCount ?? 0}
        kind="number"
        subtext="Awaiting decision"
        width="1x"
        height="05x"
      />
      <InfoCard
        title="Approval Rate"
        icon={faCheckCircle}
        iconColor="var(--alt-theme-color)"
        value={summary?.approvalRatePct ?? 0}
        kind="percent"
        subtext="Last 30 days"
        width="1x"
        height="05x"
      />
      <InfoCard
        title="Total Requested"
        icon={faDollarSign}
        iconColor="var(--alt-theme-color)"
        value={(summary?.totalRequestedCents ?? 0) / 100}
        kind="money"
        subtext="Pending approval"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<Row>
        title="Application Overview"
        icon={faList}
        iconColor="var(--theme-color)"
        columns={[
          { key: "shortId", label: "Application ID", width: "140px" },
          { key: "client", label: "Client / Business", width: "260px" },
          { key: "amount", label: "Amount", align: "right", width: "140px" },
          { key: "type", label: "Type", align: "center", width: "120px" },
          {
            key: "credit",
            label: "Credit Score",
            align: "center",
            width: "120px",
          },
          {
            key: "completion",
            label: "Completion",
            align: "center",
            width: "140px",
          },
          { key: "status", label: "Status", align: "center", width: "140px" },
          {
            key: "submitted",
            label: "Submitted",
            align: "center",
            width: "150px",
          },
          {
            key: "actions",
            label: "Actions",
            align: "center",
            width: "100px",
            render: () => (
              <span title="View">
                <i className="fa fa-eye" />
              </span>
            ),
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
