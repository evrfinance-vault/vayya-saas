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
  fmtUSD,
  fmtAPR,
} from "../../api/useActivePlans";

type StatusKey = "ALL" | "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";

type TableRow = {
  client: string;
  amount: string;
  outstanding: string;
  apr: string;
  term: string;
  progress: number;
  status: "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";
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

export default function ActivePaymentPlansPanel(): React.ReactElement {
  const [range, setRange] = React.useState<RangeKey>("ytd");
  const [plan, setPlan] = React.useState<PlanKey>("ALL");
  const [status, setStatus] = React.useState<StatusKey>("ALL");

  const { rows: raw, summary, loading } = useActivePlans(range, status, plan);

  const rows: TableRow[] = React.useMemo(() => {
    return raw.map((r) => ({
      client: r.client,
      amount: fmtUSD(r.amountCents),
      outstanding: fmtUSD(r.outstandingCents),
      apr: fmtAPR(r.aprBps),
      term: `${r.termMonths} mo`,
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

  const doExportCSV = React.useCallback(() => {
    const data = raw ?? [];
    const header = [
      "Borrower",
      "Amount ($)",
      "Outstanding ($)",
      "APR (%)",
      "Term",
      "Progress (%)",
      "Status",
    ];
    const lines = [header.join(",")];
    for (const m of data) {
      lines.push(
        [
          m.client,
          centsToDollars(m.amountCents),
          centsToDollars(m.outstandingCents),
          fmtAPR(m.aprBps),
          `${m.termMonths} mo`,
          (m.progressPct ?? 0).toFixed(1),
          m.status,
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
    a.download = `active-payment-plans-${ts}.csv`;
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
            const pct = Math.max(0, Math.min(100, m.progressPct ?? 0));
            const color =
              pct >= 90
                ? "#22c55e"
                : pct >= 75
                  ? "#3b82f6"
                  : pct >= 50
                    ? "#eab308"
                    : "#ef4444";
            return `
                <tr>
                  <td>${m.client}</td>
                  <td class="right">${money(m.amountCents)}</td>
                  <td class="right">${money(m.outstandingCents)}</td>
                  <td class="right">${fmtAPR(m.aprBps)}</td>
                  <td class="center">${m.termMonths} mo</td>
                  <td class="center">
                    <div class="bar" style="--w:${pct.toFixed(1)}%;--c:${color}"><span></span><div class="label">${pct.toFixed(1)}%</div></div>
                  </td>
                  <td class="center">${m.status}</td>
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
      <title>Active Payment Plans</title>
      <style>${styles}</style>
    </head>
    <body>
      <h1>Active Payment Plans</h1>
      <table>
        <thead>
          <tr>
            <th>Borrower</th>
            <th class="right">Amount ($)</th>
            <th class="right">Outstanding ($)</th>
            <th class="right">APR (%)</th>
            <th class="center">Term</th>
            <th class="center">Progress (%)</th>
            <th class="center">Status</th>
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
      if (ce.detail?.tabKey !== "active-payment-plans") return;
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
          { key: "client", label: "Borrower", width: "minmax(180px, 1.3fr)" },
          {
            key: "amount",
            label: "Amount",
            align: "right",
          },
          {
            key: "outstanding",
            label: "Outstanding",
            align: "right",
          },
          {
            key: "apr",
            label: "APR",
            align: "right",
          },
          {
            key: "term",
            label: "Term",
            align: "center",
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
