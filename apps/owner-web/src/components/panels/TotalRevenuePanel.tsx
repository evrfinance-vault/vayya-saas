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

function centsToDollars(n: number) {
  return (n / 100).toFixed(2);
}
function money(nCents: number) {
  return Number(nCents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TotalRevenuePanel() {
  const [monthsBack, setMonthsBack] = React.useState<"ytd" | "12m" | "all">(
    "ytd",
  );
  const [plan, setPlan] = React.useState<PlanKey>("ALL");

  const { data: summary } = useTotalRevenueSummary();
  const { data: months } = useTotalRevenueMonthly(monthsBack, plan);

  const rows = React.useMemo(
    () =>
      (months ?? []).map((m) => ({
        month: m.label,
        interest: fmtUSD(m.interestCents),
        fees: fmtUSD(m.lateFeesCents),
        total: fmtUSD(m.revenueCents),
        volume: fmtUSD(m.loanVolumeCents),
        repayRate: `${m.repaymentRatePct.toFixed(1)}%`,
        platformFees: fmtUSD(m.platformFeesCents),
        repaymentRatePct: Number(m.repaymentRatePct ?? 0),
      })),
    [months],
  );

  const repayRenderer = (row: Row) => {
    const pct = Math.max(0, Math.min(100, row.repaymentRatePct || 0));
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
        style={{
          ["--pct" as any]: `${pct}%`,
          ["--bar" as any]: color,
        }}
      >
        <span />
        <div className="label">{pct.toFixed(1)}%</div>
      </div>
    );
  };

  const doExportCSV = React.useCallback(() => {
    const data = months ?? [];
    const header = [
      "Month",
      "Interest Earned ($)",
      "Fees Collected ($)",
      "Total Revenue ($)",
      "Loan Volume ($)",
      "Repayment Rate (%)",
      "Platform Fees ($)",
    ];
    const lines = [header.join(",")];
    for (const m of data) {
      lines.push(
        [
          m.label,
          centsToDollars(m.interestCents),
          centsToDollars(m.lateFeesCents),
          centsToDollars(m.revenueCents),
          centsToDollars(m.loanVolumeCents),
          (m.repaymentRatePct ?? 0).toFixed(1),
          centsToDollars(m.platformFeesCents),
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
    a.download = `monthly-revenue-summary-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [months]);

  const buildPrintableHtml = React.useCallback(() => {
    const data = months ?? [];
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
            const pct = Math.max(0, Math.min(100, m.repaymentRatePct ?? 0));
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
                <td>${m.label}</td>
                <td class="right">$${money(m.interestCents)}</td>
                <td class="right">$${money(m.lateFeesCents)}</td>
                <td class="right">$${money(m.revenueCents)}</td>
                <td class="right">$${money(m.loanVolumeCents)}</td>
                <td class="center">
                  <div class="bar" style="--w:${pct.toFixed(1)}%;--c:${color}"><span></span><div class="label">${pct.toFixed(1)}%</div></div>
                </td>
                <td class="right">$${money(m.platformFeesCents)}</td>
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
    <title>Monthly Revenue Summary</title>
    <style>${styles}</style>
  </head>
  <body>
    <h1>Monthly Revenue Summary</h1>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th class="right">Interest Earned ($)</th>
          <th class="right">Fees Collected ($)</th>
          <th class="right">Total Revenue ($)</th>
          <th class="right">Loan Volume ($)</th>
          <th class="center">Repayment Rate (%)</th>
          <th class="right">Platform Fees ($)</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </body>
</html>`;
  }, [months]);

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
      if (ce.detail?.tabKey !== "total-revenue") return;
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
        title="Total Revenue (YTD)"
        icon={faDollarSign}
        value={(summary?.ytdRevenueCents ?? 0) / 100}
        valueColor="var(--dark-color)"
        kind="money"
        subtext={fmtYoY(summary?.yoyDeltaPct ?? 0)}
        subIcon={
          (summary?.yoyDeltaPct ?? 0) < 0 ? faArrowTrendDown : faArrowTrendUp
        }
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
          {
            key: "repayRate",
            label: "Repayment Rate",
            align: "center",
            render: repayRenderer as any,
          },
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
