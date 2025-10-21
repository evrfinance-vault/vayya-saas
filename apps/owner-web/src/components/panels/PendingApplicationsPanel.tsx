import React from "react";
import {
  faArrowTrendUp,
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
  client: string;
  amount: string;
  type: string;
  credit: string;
  completion: number;
  status: string;
  submitted: string;
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

function centsToDollars(n: number) {
  return (n / 100).toFixed(2);
}

function money(nCents: number) {
  return Number(nCents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  const doExportCSV = React.useCallback(() => {
    const data = apps ?? [];
    const header = [
      "Borrower",
      "Amount ($)",
      "Type",
      "Credit Score",
      "Completion (%)",
      "State",
      "Sent/Submitted",
    ];
    const lines = [header.join(",")];
    for (const m of data) {
      lines.push(
        [
          m.client,
          centsToDollars(m.amountCents),
          m.planType === "KAYYA" ? "Kayya-backed" : "Self-financed",
          m.creditScore == null ? "—" : String(m.creditScore),
          percentage(m.status),
          m.status,
          new Date(m.submittedAt).toLocaleDateString(),
        ].join(","),
      );
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `pending-applications-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [apps]);

  const buildPrintableHtml = React.useCallback(() => {
    const data = apps ?? [];
    const styles = `
        * { box-sizing: border-box; }
        body {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji';
          color: #0f172a; padding: 24px;
        }
        h1 { font-size: 18px; margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead th { text-align: left; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding: 8px 10px; }
        tbody td { border-bottom: 1px solid #f1f5f9; padding: 8px 10px; vertical-align: middle; }
        td.right, th.right { text-align: right; }
        td.center, th.center { text-align: center; }
        .bar { position: relative; background: #f3f4f6; height: 16px; border-radius: 9999px; overflow: hidden; }
        .bar > span { position: absolute; inset: 0; width: var(--w,0%); background: var(--c,#3b82f6); }
        .bar .label { position: relative; z-index: 1; text-align: center; font-size: 10px; line-height: 16px; color: #fff; }
        @media print { @page { margin: 14mm; } }
      `;

    const rowsHtml = data.length
      ? data
          .map((m) => {
            return `
              <tr>
                <td>${m.client}</td>
                <td class="right">${money(m.amountCents)}</td>
                <td class="center">${m.planType === "KAYYA" ? "Kayya-backed" : "Self-financed"}</td>
                <td class="center">${m.creditScore == null ? "—" : String(m.creditScore)}</td>
                <td class="center">${percentage(m.status)}%</td>
                <td class="center">${m.status}</td>
                <td class="right">${new Date(m.submittedAt).toLocaleDateString()}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="7" class="center" style="padding:20px;">No data available.</td></tr>`;

    return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="color-scheme" content="light">
      <title>Missed/Late Payments</title>
      <style>${styles}</style>
    </head>
    <body>
      <h1>Pending Applications</h1>
      <table>
        <thead>
          <tr>
            <th>Borrower</th>
            <th class="right">Amount ($)</th>
            <th class="center">Type</th>
            <th class="center">Credit Score</th>
            <th class="center">Completion (%)</th>
            <th class="center">Status</th>
            <th class="right">Sent/Submitted</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
  </html>`;
  }, [apps]);

  const printHtmlViaIframe = React.useCallback((html: string) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => iframe.remove(), 500);
      }
    }, 150);
  }, []);

  const doExportPDF = React.useCallback(() => {
    printHtmlViaIframe(buildPrintableHtml());
  }, [buildPrintableHtml, printHtmlViaIframe]);

  const doPrint = React.useCallback(() => {
    printHtmlViaIframe(buildPrintableHtml());
  }, [buildPrintableHtml, printHtmlViaIframe]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{
        tabKey?: string;
        action?: "csv" | "pdf" | "print";
      }>;
      if (ce.detail?.tabKey !== "pending-applications") return;
      switch (ce.detail.action) {
        case "csv":
          doExportCSV();
          break;
        case "pdf":
          doExportPDF();
          break;
        case "print":
          doPrint();
          break;
      }
    };
    window.addEventListener("overview:export" as any, handler as any);
    return () => {
      window.removeEventListener("overview:export" as any, handler as any);
    };
  }, [doExportCSV, doExportPDF, doPrint]);

  return (
    <div className="overview-grid">
      <InfoCard
        title="Total Applications"
        icon={faClipboardList}
        value={summary?.totalApplications ?? 0}
        kind="number"
        subtext={`${summary?.weeklyApplications ?? 0} new this week`}
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        subIcon={faArrowTrendUp}
        width="1x"
        height="05x"
      />

      <InfoCard
        title="In Review"
        icon={faClock}
        value={summary?.reviewCount ?? 0}
        kind="number"
        subtext="Awaiting decision"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Approval Rate"
        icon={faCheckCircle}
        value={summary?.approvalRatePct ?? 0}
        kind="percent"
        subtext="Last 30 days"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <InfoCard
        title="Total Requested"
        icon={faDollarSign}
        value={(summary?.totalRequestedCents ?? 0) / 100}
        kind="money"
        subtext="Pending approval"
        subColor="rgb(var(--dark-color-rgb) / 75%)"
        width="1x"
        height="05x"
      />

      <SpreadsheetCard<Row>
        title="Application Overview"
        icon={faList}
        columns={[
          { key: "client", label: "Borrower" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "type", label: "Type", align: "center" },
          { key: "credit", label: "Credit Score", align: "center" },
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
          { key: "submitted", label: "Sent/Submitted", align: "right" },
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
