import { Router } from "express";
import { prisma } from "../db/prisma";
import {
  startOfMonth,
  getDate,
  addMonths,
  format,
  isSameDay,
  startOfWeek,
  addWeeks,
  subWeeks,
  differenceInCalendarWeeks,
  startOfYear,
  addYears,
} from "date-fns";

const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 500);

export const ownerOverview = Router();

// GET /api/owner/overview/name
ownerOverview.get("/api/owner/overview/name", async (req, res) => {
  const limit = Math.min(25, Number(req.query.limit ?? 10));
  const today = new Date();

  const rows = await prisma.payment.findMany({
    take: limit,
    orderBy: [{ dueDate: "asc" }],
    where: {
      OR: [{ status: "PENDING" }, { paymentPlan: { onHold: true } }],
      dueDate: { gte: startOfMonth(addMonths(today, -1)) },
    },
    include: {
      patient: true,
      paymentPlan: { select: { planType: true, onHold: true } },
    },
  });

  type Row = (typeof rows)[number];

  const data = rows.map((p: Row) => {
    const full = `${p.patient.firstName} ${p.patient.lastName}`.trim();
    const methodLabel =
      p.paymentPlan.planType === "KAYYA" ? "Kayya-Backed" : "Self-Financed";

    let badge = "Pending";
    if (p.paymentPlan.onHold) badge = "Hold";
    else if (p.status === "PAID") badge = "Paid";
    else if (isSameDay(p.dueDate, today)) badge = "Due Today";

    return {
      id: p.id,
      name: full,
      initials: initialsFor(full),
      methodLabel,
      badge,
      amount: Math.round(p.amountCents / 100),
      dueDate: p.dueDate,
    };
  });

  res.json({ items: data });
});

// GET /api/owner/overview/account-health
ownerOverview.get("/api/owner/overview/account-health", async (_req, res) => {
  const grouped = await prisma.paymentPlan.groupBy({
    by: ["health"],
    _count: { _all: true },
    _sum: { principalCents: true },
  });

  const counts = { EXCELLENT: 0, GOOD: 0, FAIR: 0, POOR: 0 } as Record<
    string,
    number
  >;
  let totalPrincipalCents = 0;

  for (const g of grouped) {
    counts[g.health] = g._count._all;
    totalPrincipalCents += g._sum.principalCents ?? 0;
  }

  const totalPlans = counts.EXCELLENT + counts.GOOD + counts.FAIR + counts.POOR;

  return res.json({
    totalPlans,
    totalPrincipalCents,
    byHealth: counts,
  });
});

// GET /api/owner/overview/revenue-by-plan?bucket=week&weeks=52
// GET /api/owner/overview/revenue-by-plan?bucket=month&months=12
ownerOverview.get("/api/owner/overview/revenue-by-plan", async (req, res) => {
  const bucket = (req.query.bucket as "week" | "month") || "week";

  if (bucket === "week") {
    const weeks = Math.max(1, Math.min(104, Number(req.query.weeks ?? 52)));
    const now = new Date();
    const start = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 });
    const end = addWeeks(start, weeks);

    const pays = await prisma.payment.findMany({
      where: {
        OR: [
          { status: "PAID", paidAt: { gte: start, lt: end } },
          { NOT: { status: "PAID" }, dueDate: { gte: start, lt: end } },
        ],
      },
      select: {
        amountCents: true,
        status: true,
        paidAt: true,
        dueDate: true,
        paymentPlan: { select: { planType: true } },
      },
    });

    const points = Array.from({ length: weeks }, (_, i) => {
      const d = addWeeks(start, i);
      const iso = startOfWeek(d, { weekStartsOn: 1 })
        .toISOString()
        .slice(0, 10);
      return { date: iso, self: 0, kayya: 0 };
    });

    for (const p of pays) {
      const eff = p.status === "PAID" && p.paidAt ? p.paidAt : p.dueDate;
      if (!eff) continue;
      if (eff < start || eff >= end) continue;
      const idx = differenceInCalendarWeeks(eff, start, { weekStartsOn: 1 });
      if (idx < 0 || idx >= weeks) continue;
      const key = p.paymentPlan.planType === "KAYYA" ? "kayya" : "self";
      points[idx][key] += Math.round(p.amountCents / 100);
    }

    const max = points.reduce((m, p) => Math.max(m, p.self, p.kayya), 0);
    return res.json({ points, max });
  }

  const months = Math.max(1, Math.min(36, Number(req.query.months ?? 12)));
  const now = new Date();
  const start = startOfMonth(addMonths(now, -(months - 1)));

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: start, lte: now } },
    include: { paymentPlan: { select: { planType: true } } },
  });

  type Point = { label: string; date: Date; self: number; kayya: number };
  const points: Point[] = [];
  for (let i = 0; i < months; i++) {
    const d = startOfMonth(addMonths(start, i));
    points.push({ label: format(d, "MMM"), date: d, self: 0, kayya: 0 });
  }

  for (const pay of payments) {
    const paidAt = pay.paidAt!;
    const idx = Math.floor(
      (paidAt.getFullYear() - start.getFullYear()) * 12 +
        paidAt.getMonth() -
        start.getMonth(),
    );
    if (idx < 0 || idx >= months) continue;
    const key = pay.paymentPlan.planType === "KAYYA" ? "kayya" : "self";
    points[idx][key] += pay.amountCents / 100;
  }

  const max = points.reduce((m, p) => Math.max(m, p.self, p.kayya), 0);
  res.json({
    points: points.map((p) => ({
      date: p.date.toISOString().slice(0, 10),
      self: p.self,
      kayya: p.kayya,
    })),
    max,
  });
});

// GET /api/owner/overview/payouts-by-day?year=YYYY&month=1-12
ownerOverview.get("/api/owner/overview/payouts-by-day", async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year ?? now.getFullYear());
  const month1 = Number(req.query.month ?? now.getMonth() + 1);
  const month0 = Math.min(12, Math.max(1, month1)) - 1;

  const start = startOfMonth(new Date(year, month0, 1));
  const next = startOfMonth(addMonths(start, 1));

  const [paid, scheduled] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PAID", paidAt: { gte: start, lt: next } },
      select: { amountCents: true, paidAt: true },
    }),
    prisma.payment.findMany({
      where: { NOT: { status: "PAID" }, dueDate: { gte: start, lt: next } },
      select: { amountCents: true, dueDate: true },
    }),
  ]);

  const totals: Record<number, number> = {};
  const paidTotals: Record<number, number> = {};
  const schedTotals: Record<number, number> = {};

  for (const p of paid) {
    const d = getDate(p.paidAt!);
    paidTotals[d] = (paidTotals[d] ?? 0) + p.amountCents;
    totals[d] = (totals[d] ?? 0) + p.amountCents;
  }
  for (const s of scheduled) {
    const d = getDate(s.dueDate);
    schedTotals[d] = (schedTotals[d] ?? 0) + s.amountCents;
    totals[d] = (totals[d] ?? 0) + s.amountCents;
  }

  res.json({
    year,
    month: month1,
    totals,
    paid: paidTotals,
    scheduled: schedTotals,
  });
});

// GET /api/owner/total-revenue/summary
ownerOverview.get("/api/owner/total-revenue/summary", async (_req, res) => {
  const now = new Date();
  const ytdStart = startOfYear(now);
  const prevStart = startOfYear(addYears(now, -1));
  const prevEnd = addYears(now, -1);

  const [allAgg, ytdAgg, prevAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: ytdStart, lte: now } },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: prevStart, lte: prevEnd } },
      _sum: { amountCents: true },
    }),
  ]);

  const allTimeRevenueCents = allAgg._sum.amountCents ?? 0;
  const ytdRevenueCents = ytdAgg._sum.amountCents ?? 0;
  const prevCents = prevAgg._sum.amountCents ?? 0;

  const yoyDeltaPct = prevCents
    ? ((ytdRevenueCents - prevCents) / prevCents) * 100
    : 0;

  const platformFeesYtdCents = Math.round(
    (ytdRevenueCents * PLATFORM_FEE_BPS) / 10000,
  );

  res.json({
    allTimeRevenueCents,
    ytdRevenueCents,
    yoyDeltaPct,
    platformFeeBps: PLATFORM_FEE_BPS,
    platformFeesYtdCents,
  });
});

// GET /api/owner/total-revenue/monthly?range=3m|6m|12m|ltd&plan=ALL|SELF|KAYYA
// GET /api/owner/total-revenue/monthly?months=12
ownerOverview.get("/api/owner/total-revenue/monthly", async (req, res) => {
  type PlanKey = "ALL" | "SELF" | "KAYYA";
  const planParam = String(req.query.plan ?? "ALL").toUpperCase() as PlanKey;
  const plan: PlanKey =
    planParam === "SELF" || planParam === "KAYYA" ? planParam : "ALL";

  const range = req.query.range
    ? String(req.query.range).toLowerCase()
    : undefined;
  const monthsFromRange =
    range === "3m"
      ? 3
      : range === "6m"
        ? 6
        : range === "12m"
          ? 12
          : range === "ltd"
            ? null
            : undefined;

  let explicitMonths: number | undefined;
  if (req.query.months != null) {
    const n = Number(req.query.months);
    if (Number.isFinite(n)) {
      explicitMonths = Math.max(1, Math.min(120, n));
    }
  }

  const now = new Date();
  const endMonth = startOfMonth(now);

  const planWhere = (p: PlanKey) =>
    p === "ALL" ? {} : ({ paymentPlan: { is: { planType: p } } } as const);

  let firstMonth: Date;
  if (monthsFromRange === null) {
    const [minPaid, minDue, minStart] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "PAID", ...planWhere(plan) },
        _min: { paidAt: true },
      }),
      prisma.payment.aggregate({
        where: { ...planWhere(plan) },
        _min: { dueDate: true },
      }),
      prisma.paymentPlan.aggregate({
        where: plan === "ALL" ? {} : { planType: plan },
        _min: { startDate: true },
      }),
    ]);

    const candidates = [
      minPaid._min.paidAt ?? undefined,
      minDue._min.dueDate ?? undefined,
      minStart._min.startDate ?? undefined,
    ].filter(Boolean) as Date[];

    const earliest = candidates.length
      ? candidates.reduce((a, b) => (a < b ? a : b))
      : endMonth;

    firstMonth = startOfMonth(earliest);
  } else {
    const m = explicitMonths ?? monthsFromRange ?? 12;
    firstMonth = startOfMonth(addMonths(endMonth, -(m - 1)));
  }

  const monthsCount =
    monthsFromRange === null
      ? Math.max(
          1,
          (endMonth.getFullYear() - firstMonth.getFullYear()) * 12 +
            (endMonth.getMonth() - firstMonth.getMonth()) +
            1,
        )
      : (explicitMonths ?? monthsFromRange ?? 12);

  const nextAfterEnd = addMonths(endMonth, 1);

  const [paid, due, startedPlans] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: firstMonth, lt: nextAfterEnd },
        ...planWhere(plan),
      },
      select: { amountCents: true, paidAt: true },
      orderBy: { paidAt: "desc" },
    }),
    prisma.payment.findMany({
      where: {
        dueDate: { gte: firstMonth, lt: nextAfterEnd },
        ...planWhere(plan),
      },
      select: { amountCents: true, dueDate: true },
      orderBy: { dueDate: "desc" },
    }),
    prisma.paymentPlan.findMany({
      where: {
        startDate: { gte: firstMonth, lt: nextAfterEnd },
        ...(plan === "ALL" ? {} : { planType: plan }),
      },
      select: { principalCents: true, startDate: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const idxFromFirst = (d: Date) =>
    (d.getFullYear() - firstMonth.getFullYear()) * 12 +
    (d.getMonth() - firstMonth.getMonth());

  type Row = {
    ym: string;
    label: string;
    revenueCents: number;
    loanVolumeCents: number;
    dueCents: number;
    paidCents: number;
    repaymentRatePct: number;
    platformFeesCents: number;
  };

  const rows: Row[] = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const mStart = startOfMonth(addMonths(firstMonth, i));
    rows.push({
      ym: format(mStart, "yyyy-MM"),
      label: format(mStart, "MMMM yyyy"),
      revenueCents: 0,
      loanVolumeCents: 0,
      dueCents: 0,
      paidCents: 0,
      repaymentRatePct: 0,
      platformFeesCents: 0,
    });
  }

  const writePos = (d: Date) => {
    const idx = idxFromFirst(d);
    return monthsCount - 1 - idx;
  };

  for (const p of paid) {
    const pos = writePos(p.paidAt!);
    if (pos >= 0 && pos < monthsCount) {
      rows[pos].revenueCents += p.amountCents;
      rows[pos].paidCents += p.amountCents;
    }
  }
  for (const p of due) {
    const pos = writePos(p.dueDate);
    if (pos >= 0 && pos < monthsCount) rows[pos].dueCents += p.amountCents;
  }
  for (const pl of startedPlans) {
    const pos = writePos(pl.startDate);
    if (pos >= 0 && pos < monthsCount)
      rows[pos].loanVolumeCents += pl.principalCents;
  }

  for (const r of rows) {
    r.repaymentRatePct =
      r.dueCents > 0 ? Math.min(100, (r.paidCents / r.dueCents) * 100) : 0;
    r.platformFeesCents = Math.round(
      (r.revenueCents * PLATFORM_FEE_BPS) / 10000,
    );
  }

  res.json({ months: rows });
});

// GET /api/owner/active-plans?range=3m|6m|12m|ltd&status=ALL|ACTIVE|HOLD|DELINQUENT|PAID&plan=ALL|SELF|KAYYA
ownerOverview.get("/api/owner/active-plans", async (req, res) => {
  type PlanKey = "ALL" | "SELF" | "KAYYA";
  type StatusKey = "ALL" | "ACTIVE" | "HOLD" | "DELINQUENT" | "PAID";

  type ActivePlanRow = {
    id: string;
    client: string;
    amountCents: number;
    outstandingCents: number;
    aprBps: number;
    termMonths: number;
    progressPct: number;
    status: StatusKey;
    planType: "SELF" | "KAYYA";
  };

  const planParam = String(req.query.plan ?? "ALL").toUpperCase() as PlanKey;
  const plan: PlanKey =
    planParam === "SELF" || planParam === "KAYYA" ? planParam : "ALL";

  const rangeParam = String(req.query.range ?? "12m").toLowerCase();
  const monthsFromRange =
    rangeParam === "3m"
      ? 3
      : rangeParam === "6m"
        ? 6
        : rangeParam === "12m"
          ? 12
          : rangeParam === "ltd"
            ? null
            : 12;

  const statusParam = String(
    req.query.status ?? "ALL",
  ).toUpperCase() as StatusKey;
  const statusFilter: StatusKey = [
    "ALL",
    "ACTIVE",
    "HOLD",
    "DELINQUENT",
    "PAID",
  ].includes(statusParam)
    ? statusParam
    : "ALL";

  const now = new Date();
  const endMonth = startOfMonth(now);
  const firstMonth =
    monthsFromRange == null
      ? new Date(0)
      : startOfMonth(addMonths(endMonth, -(monthsFromRange - 1)));

  const wherePlan: any = {
    ...(monthsFromRange == null ? {} : { startDate: { gte: firstMonth } }),
    ...(plan === "ALL" ? {} : { planType: plan }),
  };

  const plans = await prisma.paymentPlan.findMany({
    where: wherePlan,
    include: {
      patient: { select: { firstName: true, lastName: true } },
      payments: {
        select: {
          amountCents: true,
          status: true,
          dueDate: true,
          paidAt: true,
        },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { startDate: "desc" },
  });

  type PlanWithJoins = {
    id: string;
    principalCents: number;
    termMonths: number;
    planType: "SELF" | "KAYYA";
    onHold: boolean;
    patient: { firstName: string; lastName: string };
    payments: Array<{
      amountCents: number;
      status: "PENDING" | "PAID" | "HOLD";
      dueDate: Date;
      paidAt: Date | null;
    }>;
  };

  const rows: ActivePlanRow[] = plans.map(
    (pl: PlanWithJoins): ActivePlanRow => {
      const fullName = `${pl.patient.firstName} ${pl.patient.lastName}`.trim();

      let paidCount = 0;
      let totalCount = pl.payments.length;
      let outstandingCents = 0;
      let hasOverdue = false;
      let hasHold = pl.onHold;

      for (const p of pl.payments) {
        if (p.status === "PAID") paidCount++;
        else outstandingCents += p.amountCents;

        if (p.status !== "PAID" && p.status !== "HOLD" && p.dueDate < now) {
          hasOverdue = true;
        }
        if (p.status === "HOLD") hasHold = true;
      }

      let derivedStatus: StatusKey;
      if (totalCount > 0 && paidCount === totalCount) derivedStatus = "PAID";
      else if (hasHold) derivedStatus = "HOLD";
      else if (hasOverdue) derivedStatus = "DELINQUENT";
      else derivedStatus = "ACTIVE";

      const progressPct = totalCount
        ? Math.round((paidCount / totalCount) * 100)
        : 0;

      const aprBps = 0;

      return {
        id: pl.id,
        client: fullName,
        amountCents: pl.principalCents,
        outstandingCents,
        aprBps,
        termMonths: pl.termMonths,
        progressPct,
        status: derivedStatus,
        planType: pl.planType,
      };
    },
  );

  const filtered: ActivePlanRow[] = rows.filter((r: ActivePlanRow) =>
    statusFilter === "ALL" ? true : r.status === statusFilter,
  );

  res.json({ rows: filtered });
});

// GET /api/owner/late-payments/summary
ownerOverview.get("/api/owner/late-payments/summary", async (_req, res) => {
  const now = new Date();

  const plans = await prisma.paymentPlan.findMany({
    include: {
      payments: {
        where: { NOT: { status: "PAID" } },
        select: { amountCents: true, status: true, dueDate: true },
      },
    },
  });

  let delinquentAccounts = 0;
  let amountOverdueCents = 0;
  let atRiskCents = 0;
  let sumDays = 0;
  let cntDays = 0;

  for (const pl of plans) {
    const outstanding = pl.payments.reduce((s, p) => s + p.amountCents, 0);
    const overdue = pl.payments.filter(
      (p) => p.status !== "PAID" && p.dueDate < now,
    );

    if (overdue.length) {
      delinquentAccounts += 1;
      atRiskCents += outstanding;
      for (const p of overdue) {
        amountOverdueCents += p.amountCents;
        const days = Math.max(
          0,
          Math.floor((+now - +p.dueDate) / (1000 * 60 * 60 * 24)),
        );
        sumDays += days;
        cntDays += 1;
      }
    }
  }

  const avgDaysOverdue = cntDays ? Math.round(sumDays / cntDays) : 0;

  res.json({ delinquentAccounts, amountOverdueCents, atRiskCents, avgDaysOverdue });
});

// GET /api/owner/late-payments/list?status=ALL|LATE|HOLD&risk=ALL|LOW|MEDIUM|HIGH&daysMin=0
ownerOverview.get("/api/owner/late-payments/list", async (req, res) => {
  type StatusKey = "ALL" | "LATE" | "HOLD";
  const statusParam = String(req.query.status ?? "ALL").toUpperCase() as StatusKey;
  const riskParam = String(req.query.risk ?? "ALL").toUpperCase() as
    | "ALL" | "LOW" | "MEDIUM" | "HIGH";
  const daysMin = Math.max(0, Number(req.query.daysMin ?? 0));

  const now = new Date();

  const plans = await prisma.paymentPlan.findMany({
    include: {
      patient: { select: { firstName: true, lastName: true } },
      payments: {
        where: { NOT: { status: "PAID" } },
        select: { amountCents: true, status: true, dueDate: true },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { startDate: "desc" },
  });

  type PlanRow = (typeof plans)[number];

  const rows = plans.map((pl: PlanRow) => {
    const full = `${pl.patient.firstName} ${pl.patient.lastName}`.trim();

    let outstandingCents = 0;
    let overdueCents = 0;
    let missedCount = 0;
    let hold = pl.onHold;
    let maxDays = 0;

    for (const p of pl.payments) {
      outstandingCents += p.amountCents;
      if (p.status === "HOLD") hold = true;
      if (p.dueDate < now && p.status !== "HOLD") {
        overdueCents += p.amountCents;
        missedCount += 1;
        const days = Math.max(
          0,
          Math.floor((+now - +p.dueDate) / (1000 * 60 * 60 * 24)),
        );
        if (days > maxDays) maxDays = days;
      }
    }

    const isLate = overdueCents > 0;
    const status: "LATE" | "HOLD" = hold && !isLate ? "HOLD" : "LATE";
    const risk = riskFromDays(maxDays);

    return {
      id: pl.id,
      client: full,
      outstandingCents,
      overdueCents,
      daysOverdue: maxDays,
      missedPayments: missedCount,
      risk,
      status,
      planType: pl.planType,
    };
  });

  const filtered = rows.filter((r) => {
    if (statusParam !== "ALL" && r.status !== statusParam) return false;
    if (riskParam !== "ALL" && r.risk !== riskParam) return false;
    if (r.daysOverdue < daysMin) return false;
    return true;
  });

  res.json({ rows: filtered });
});

// helpers

function initialsFor(n: string) {
  const parts = n.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function riskFromDays(maxDays: number): "LOW" | "MEDIUM" | "HIGH" {
  if (maxDays >= 45) return "HIGH";
  if (maxDays >= 15) return "MEDIUM";
  return "LOW";
}
