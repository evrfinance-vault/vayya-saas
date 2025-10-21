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

function centsToDollars(n: number) {
  return (n / 100).toFixed(2);
}

function money(nCents: number) {
  return Number(nCents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  const riskRenderer = (row: { risk: "LOW" | "MEDIUM" | "HIGH" }) => {
    const COLORS: Record<typeof row.risk, string> = {
      LOW: "var(--theme-color)",
      MEDIUM: "var(--fair-health-color)",
      HIGH: "var(--poor-health-color)",
    };
    const label =
      row.risk === "HIGH" ? "High" : row.risk === "MEDIUM" ? "Medium" : "Low";

    return (
      <span
        className="status-pill"
        style={{ ["--pill-bg" as any]: COLORS[row.risk] }}
      >
        {label}
      </span>
    );
  };

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

  const doExportCSV = React.useCallback(() => {
    const data = raw ?? [];
    const header = [
      "Borrower",
      "Outstanding ($)",
      "Amount Overdue ($)",
      "Days Overdue",
      "Missed Payments",
      "Risk Level",
      "Type",
    ];
    const lines = [header.join(",")];
    for (const m of data) {
      lines.push(
        [
          m.client,
          centsToDollars(m.outstandingCents),
          centsToDollars(m.overdueCents),
          `${m.daysOverdue} days`,
          String(m.missedPayments),
          m.risk,
          m.planType === "KAYYA" ? "Kayya-backed" : "Self-financed",
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
    a.download = `missed-late-payments-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [raw]);

  const buildPrintableHtml = React.useCallback(() => {
    const data = raw ?? [];
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
                <td class="right">${money(m.outstandingCents)}</td>
                <td class="right">${money(m.overdueCents)}</td>
                <td class="center">${m.daysOverdue} days</td>
                <td class="center">${String(m.missedPayments)} mo</td>
                <td class="center">${m.risk}</td>
                <td class="center">${m.planType === "KAYYA" ? "Kayya-backed" : "Self-financed"}</td>
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
      <h1>Active Payment Plans</h1>
      <table>
        <thead>
          <tr>
            <th>Borrower</th>
            <th class="right">Outstanding ($)</th>
            <th class="right">Amount Overdue ($)</th>
            <th class="center">Days Overdue</th>
            <th class="center">Missed Payments</th>
            <th class="center">Risk Level</th>
            <th class="center">Type</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
  </html>`;
  }, [raw]);

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
      if (ce.detail?.tabKey !== "late-payments") return;
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
