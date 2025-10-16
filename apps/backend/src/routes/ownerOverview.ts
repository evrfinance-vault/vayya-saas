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

type PlanMeta = {
  principalCents: number;
  downPaymentCents: number;
  termMonths: number;
  aprBps: number;
  payments: { id: string; dueDate: Date }[];
};

const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 499);

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
      paymentPlan: {
        select: {
          planType: true,
          onHold: true,
          payments: {
            select: { status: true, dueDate: true },
            orderBy: { dueDate: "asc" },
          },
        },
      },
    },
  });

  type Row = (typeof rows)[number];

  const data = rows.map((p: Row) => {
    const full = `${p.patient.firstName} ${p.patient.lastName}`.trim();
    const methodLabel =
      p.paymentPlan.planType === "KAYYA" ? "Kayya-Backed" : "Self-Financed";

    const hadPriorPaid = (p.paymentPlan.payments ?? []).some(
      (q) => q.dueDate < p.dueDate && q.status === "PAID",
    );

    let badge: "Hold" | "Paid" | "Due Today" | "Paying" | "Pending" = "Pending";
    if (p.paymentPlan.onHold) badge = "Hold";
    else if (p.status === "PAID") badge = "Paid";
    else if (isSameDay(p.dueDate, today)) badge = "Due Today";
    else if (hadPriorPaid) badge = "Paying";

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
  const prevEndSameDay = addYears(now, -1);

  const [allPaid, allLate] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { lateFeeCents: true },
    }),
  ]);
  const allTimeRevenueCents =
    (allPaid._sum.amountCents ?? 0) + (allLate._sum.lateFeeCents ?? 0);

  const [ytdPaid, ytdLate] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: ytdStart, lte: now } },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: ytdStart, lte: now } },
      _sum: { lateFeeCents: true },
    }),
  ]);
  const ytdRevenueCents =
    (ytdPaid._sum.amountCents ?? 0) + (ytdLate._sum.lateFeeCents ?? 0);

  const [prevPaid, prevLate] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: prevStart, lte: prevEndSameDay },
      },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: prevStart, lte: prevEndSameDay },
      },
      _sum: { lateFeeCents: true },
    }),
  ]);
  const prevRevenueCents =
    (prevPaid._sum.amountCents ?? 0) + (prevLate._sum.lateFeeCents ?? 0);

  const paidYtd = await prisma.payment.findMany({
    where: { status: "PAID", paidAt: { gte: ytdStart, lte: now } },
    select: {
      id: true,
      amountCents: true,
      lateFeeCents: true,
      paidAt: true,
      paymentPlan: {
        select: {
          principalCents: true,
          downPaymentCents: true,
          termMonths: true,
          aprBps: true,
          payments: { select: { id: true, dueDate: true } },
        },
      },
    },
  });

  let interestYtdCents = 0;
  let lateFeesYtdCents = 0;
  for (const p of paidYtd) {
    interestYtdCents += interestForPayment(p.paymentPlan as PlanMeta, p.id);
    lateFeesYtdCents += p.lateFeeCents ?? 0;
  }

  const dueYtd = await prisma.payment.findMany({
    where: { dueDate: { gte: ytdStart, lte: now } },
    select: { amountCents: true, status: true, dueDate: true, paidAt: true },
  });
  let dueCents = 0;
  let onTimeCents = 0;
  for (const d of dueYtd) {
    dueCents += d.amountCents;
    if (d.status === "PAID" && onTime(d.paidAt ?? null, d.dueDate)) {
      onTimeCents += d.amountCents;
    }
  }
  const avgRepaymentRatePct = dueCents ? (onTimeCents / dueCents) * 100 : 0;

  const yoyDeltaPct = prevRevenueCents
    ? ((ytdRevenueCents - prevRevenueCents) / prevRevenueCents) * 100
    : 0;

  res.json({
    allTimeRevenueCents,
    ytdRevenueCents,
    interestYtdCents,
    lateFeesYtdCents,
    yoyDeltaPct,
    platformFeeBps: PLATFORM_FEE_BPS,
    avgRepaymentRatePct,
  });
});

// GET /api/owner/total-revenue/monthly?range=ytd|12m|all&plan=ALL|SELF|KAYYA
ownerOverview.get("/api/owner/total-revenue/monthly", async (req, res) => {
  type PlanKey = "ALL" | "SELF" | "KAYYA";
  const planParam = String(req.query.plan ?? "ALL").toUpperCase() as PlanKey;
  const plan: PlanKey =
    planParam === "SELF" || planParam === "KAYYA" ? planParam : "ALL";
  const planFilter =
    plan === "ALL" ? {} : { paymentPlan: { is: { planType: plan } } };

  const range = (req.query.range as string | undefined)?.toLowerCase();
  const useAll = range === "all" || range === "ltd";
  const useYtd = range === "ytd";

  const now = new Date();
  const endMonth = startOfMonth(now);

  let firstMonth: Date;
  if (useAll) {
    const minStart = await prisma.paymentPlan.aggregate({
      _min: { startDate: true },
    });
    firstMonth = startOfMonth(minStart._min.startDate ?? endMonth);
  } else if (useYtd) {
    firstMonth = startOfMonth(startOfYear(now));
  } else {
    firstMonth = startOfMonth(addMonths(endMonth, -11));
  }

  const nextAfterEnd = addMonths(endMonth, 1);
  const paid = await prisma.payment.findMany({
    where: {
      status: "PAID",
      paidAt: { gte: firstMonth, lt: nextAfterEnd },
      ...planFilter,
    },
    select: {
      id: true,
      paidAt: true,
      amountCents: true,
      lateFeeCents: true,
      paymentPlan: {
        select: {
          principalCents: true,
          downPaymentCents: true,
          termMonths: true,
          aprBps: true,
          payments: { select: { id: true, dueDate: true } },
        },
      },
    },
  });

  const due = await prisma.payment.findMany({
    where: { dueDate: { gte: firstMonth, lt: nextAfterEnd }, ...planFilter },
    select: { amountCents: true, status: true, dueDate: true, paidAt: true },
  });

  const startedPlans = await prisma.paymentPlan.findMany({
    where: {
      startDate: { gte: firstMonth, lt: nextAfterEnd },
      ...(plan === "ALL" ? {} : { planType: plan }),
    },
    select: { principalCents: true, startDate: true },
    orderBy: { startDate: "desc" },
  });

  type Row = {
    ym: string;
    label: string;
    date: Date;
    revenueCents: number;
    loanVolumeCents: number;
    dueCents: number;
    paidCents: number;
    onTimeCents: number;
    repaymentRatePct: number;
    platformFeesCents: number;
    interestCents: number;
    lateFeesCents: number;
  };

  const monthsCount =
    (endMonth.getFullYear() - firstMonth.getFullYear()) * 12 +
    (endMonth.getMonth() - firstMonth.getMonth()) +
    1;

  const rows: Row[] = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = startOfMonth(addMonths(firstMonth, i));
    rows.push({
      ym: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy"),
      date: d,
      revenueCents: 0,
      loanVolumeCents: 0,
      dueCents: 0,
      paidCents: 0,
      onTimeCents: 0,
      repaymentRatePct: 0,
      platformFeesCents: 0,
      interestCents: 0,
      lateFeesCents: 0,
    });
  }

  const idxFromFirst = (d: Date) =>
    (d.getFullYear() - firstMonth.getFullYear()) * 12 +
    (d.getMonth() - firstMonth.getMonth());
  const indexForDate = (d: Date) => monthsCount - 1 - idxFromFirst(d);

  for (const p of paid) {
    const i = indexForDate(p.paidAt!);
    if (i < 0 || i >= monthsCount) continue;
    const interest = interestForPayment(p.paymentPlan as PlanMeta, p.id);
    const fees = p.lateFeeCents ?? 0;
    rows[i].interestCents += interest;
    rows[i].lateFeesCents += fees;
    rows[i].revenueCents += (p.amountCents ?? 0) + fees;
  }

  for (const d of due) {
    const i = indexForDate(d.dueDate);
    if (i < 0 || i >= monthsCount) continue;
    rows[i].dueCents += d.amountCents;
    if (d.status === "PAID" && onTime(d.paidAt ?? null, d.dueDate)) {
      rows[i].onTimeCents += d.amountCents;
    }
  }

  for (const pl of startedPlans) {
    const i = indexForDate(pl.startDate);
    if (i >= 0 && i < rows.length) rows[i].loanVolumeCents += pl.principalCents;
  }

  for (const r of rows) {
    r.repaymentRatePct = r.dueCents
      ? Math.min(100, (r.onTimeCents / r.dueCents) * 100)
      : 0;
    r.platformFeesCents = Math.round(
      (r.interestCents * PLATFORM_FEE_BPS) / 10000,
    );
  }

  return res.json({ months: rows });
});

// GET /api/owner/active-plans/summary?plan=ALL|SELF|KAYYA
ownerOverview.get("/api/owner/active-plans/summary", async (req, res) => {
  type PlanKey = "ALL" | "SELF" | "KAYYA";
  const planParam = String(req.query.plan ?? "ALL").toUpperCase() as PlanKey;
  const plan: PlanKey =
    planParam === "SELF" || planParam === "KAYYA" ? planParam : "ALL";
  const planWhere = plan === "ALL" ? {} : { planType: plan };

  const plans = await prisma.paymentPlan.findMany({
    where: planWhere,
    select: {
      id: true,
      onHold: true,
      principalCents: true,
      downPaymentCents: true,
      termMonths: true,
      aprBps: true,
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
  });

  const active = plans.filter(
    (pl) => !pl.onHold && pl.payments.some((p) => p.status !== "PAID"),
  );
  const activeIds = active.map((p) => p.id);
  const activeCount = active.length;

  const totalFinancedCents = active.reduce((s, p) => s + p.principalCents, 0);

  const outstandingCents = active.reduce((s, p) => {
    const remain = p.payments
      .filter((pp) => pp.status !== "PAID" && pp.status !== "HOLD")
      .reduce((x, y) => x + y.amountCents, 0);
    return s + remain;
  }, 0);

  const now = new Date();
  const ytdStart = startOfYear(now);

  let interestEarnedYtdCents = 0;
  if (activeIds.length) {
    const paidYtd = await prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: ytdStart, lte: now },
        paymentPlan: { id: { in: activeIds } },
      },
      select: {
        id: true,
        paymentPlan: {
          select: {
            principalCents: true,
            downPaymentCents: true,
            termMonths: true,
            aprBps: true,
            payments: { select: { id: true, dueDate: true } },
          },
        },
      },
    });

    for (const p of paidYtd) {
      interestEarnedYtdCents += interestForPayment(
        p.paymentPlan as unknown as PlanMeta,
        p.id,
      );
    }
  }

  const aprDen = active.reduce(
    (s, p) => s + Math.max(0, p.principalCents - (p.downPaymentCents ?? 0)),
    0,
  );
  const aprNum = active.reduce((s, p) => {
    const financed = Math.max(0, p.principalCents - (p.downPaymentCents ?? 0));
    return s + financed * (p.aprBps ?? 0);
  }, 0);
  const avgAprBps = aprDen ? Math.round(aprNum / aprDen) : 0;

  res.json({
    activeCount,
    totalFinancedCents,
    outstandingCents,
    interestEarnedYtdCents,
    avgAprBps,
  });
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
    aprBps: number;
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

      const aprBps = pl.aprBps ?? 0;

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
    const outstanding = (pl.payments as Array<{ amountCents: number }>).reduce(
      (s, p) => s + p.amountCents,
      0,
    );
    const overdue = pl.payments.filter(
      (p: { status: "PENDING" | "PAID" | "HOLD"; dueDate: Date }) =>
        p.status !== "PAID" && p.status !== "HOLD" && p.dueDate < now,
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

  res.json({
    delinquentAccounts,
    amountOverdueCents,
    atRiskCents,
    avgDaysOverdue,
  });
});

// GET /api/owner/late-payments/list?status=ALL|LATE|HOLD&risk=ALL|LOW|MEDIUM|HIGH&daysMin=0
ownerOverview.get("/api/owner/late-payments/list", async (req, res) => {
  type StatusKey = "ALL" | "LATE" | "HOLD";
  const statusParam = String(
    req.query.status ?? "ALL",
  ).toUpperCase() as StatusKey;
  const riskParam = String(req.query.risk ?? "ALL").toUpperCase() as
    | "ALL"
    | "LOW"
    | "MEDIUM"
    | "HIGH";
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

  type LateRow = {
    id: string;
    client: string;
    outstandingCents: number;
    overdueCents: number;
    daysOverdue: number;
    missedPayments: number;
    risk: "LOW" | "MEDIUM" | "HIGH";
    status: "LATE" | "HOLD";
    planType: "SELF" | "KAYYA";
  };

  const rows: LateRow[] = plans.map((pl: any) => {
    const full = `${pl.patient.firstName} ${pl.patient.lastName}`.trim();

    let outstandingCents = 0;
    let overdueCents = 0;
    let missedCount = 0;
    let hold = (pl as any).onHold as boolean;
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

  const filtered: LateRow[] = rows.filter(
    (r: LateRow) =>
      (statusParam === "ALL" ? true : r.status === statusParam) &&
      (riskParam === "ALL" ? true : r.risk === riskParam) &&
      r.daysOverdue >= daysMin,
  );

  res.json({ rows: filtered });
});

// GET /api/owner/applications/summary
ownerOverview.get("/api/owner/applications/summary", async (_req, res) => {
  const pendingStatuses = ["SENT", "PENDING", "CONTACTED"] as const;
  const approvedStatuses = ["PAID", "DONE"] as const;

  const now = new Date();
  const last30 = new Date(now);
  last30.setDate(now.getDate() - 30);

  const [total, pending, last30Totals, last30Approved, pendingSum] =
    await Promise.all([
      prisma.application.count(),
      prisma.application.count({
        where: { status: { in: pendingStatuses as any } },
      }),
      prisma.application.count({ where: { submittedAt: { gte: last30 } } }),
      prisma.application.count({
        where: {
          submittedAt: { gte: last30 },
          status: { in: approvedStatuses as any },
        },
      }),
      prisma.application.aggregate({
        where: { status: { in: pendingStatuses as any } },
        _sum: { amountCents: true },
      }),
    ]);

  const approvalRatePct = last30Totals
    ? (last30Approved / last30Totals) * 100
    : 0;

  res.json({
    totalApplications: total,
    pendingReviewCount: pending,
    approvalRatePct,
    totalRequestedCents: pendingSum._sum.amountCents ?? 0,
  });
});

// GET /api/owner/applications?range=all|30d|90d|ytd&status=ALL|SENT|FAILED|PENDING|PAID|CONTACTED|DONE&plan=ALL|SELF|KAYYA
ownerOverview.get("/api/owner/applications", async (req, res) => {
  type PlanKey = "ALL" | "SELF" | "KAYYA";
  type AppStatus =
    | "ALL"
    | "SENT"
    | "FAILED"
    | "PENDING"
    | "PAID"
    | "CONTACTED"
    | "DONE";

  const planQ = String(req.query.plan ?? "ALL").toUpperCase() as PlanKey;
  const statusQ = String(req.query.status ?? "ALL").toUpperCase() as AppStatus;
  const rangeQ = String(req.query.range ?? "all").toLowerCase();

  const planWhere = planQ === "ALL" ? {} : { planType: planQ as any };
  const statusWhere = statusQ === "ALL" ? {} : { status: statusQ as any };

  const now = new Date();
  let submittedWhere: { gte?: Date; lt?: Date } = {};
  if (rangeQ === "30d") {
    submittedWhere = { gte: new Date(now.getTime() - 30 * 864e5) };
  } else if (rangeQ === "90d") {
    submittedWhere = { gte: new Date(now.getTime() - 90 * 864e5) };
  } else if (rangeQ === "ytd") {
    submittedWhere = { gte: new Date(now.getFullYear(), 0, 1) };
  }

  const apps = await prisma.application.findMany({
    where: {
      ...planWhere,
      ...statusWhere,
      ...(rangeQ === "all" ? {} : { submittedAt: submittedWhere }),
    },
    include: {
      patient: { select: { firstName: true, lastName: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const rows = apps.map((a: (typeof apps)[number]) => ({
    id: a.id,
    client: `${a.patient.firstName} ${a.patient.lastName}`.trim(),
    amountCents: a.amountCents,
    planType: a.planType,
    status: a.status,
    submittedAt: a.submittedAt,
  }));

  res.json({ rows });
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

function interestForPayment(plan: PlanMeta, paymentId: string) {
  const financed = Math.max(0, plan.principalCents - plan.downPaymentCents);
  const totalInterest = Math.round((financed * (plan.aprBps ?? 0)) / 10000);
  const base = Math.floor(totalInterest / plan.termMonths);
  const remainder = totalInterest - base * plan.termMonths;
  const idx = plan.payments
    .sort((a, b) => +a.dueDate - +b.dueDate)
    .findIndex((p) => p.id === paymentId);
  if (idx < 0) return 0;
  return base + (idx === plan.termMonths - 1 ? remainder : 0);
}

function onTime(paidAt: Date | null, dueDate: Date) {
  return !!paidAt && paidAt <= dueDate;
}
