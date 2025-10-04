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
} from "date-fns";

export const ownerOverview = Router();

/**
 * GET /api/owner/overview/name
 * Returns upcoming payments for the "Name" card.
 * Shape: [{ id, firstName, lastName, description, badge, amountCents }]
 */
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

function initialsFor(n: string) {
  const parts = n.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

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

/**
 * GET /api/owner/overview/revenue-by-plan
 *
 * Query:
 * - bucket=week|month (default week)
 * - weeks=number (default 52)
 * - months=number (default 12)  // only used when bucket=month
 *
 * For PAID payments we count revenue at `paidAt`, otherwise at `dueDate`.
 * Weekly buckets start on Monday (ISO-like).
 * Returns dollars (not cents) to match your card’s formatter.
 */
ownerOverview.get("/api/owner/overview/revenue-by-plan", async (req, res) => {
  const bucket = (req.query.bucket as "week" | "month") || "week";

  if (bucket === "week") {
    const weeks = Math.max(1, Math.min(104, Number(req.query.weeks ?? 52)));
    const now = new Date();
    const start = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 }); // Monday
    const end = addWeeks(start, weeks); // exclusive

    // Fetch only what we need
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
      points[idx][key] += Math.round(p.amountCents / 100); // dollars
    }

    const max = points.reduce((m, p) => Math.max(m, p.self, p.kayya), 0);
    return res.json({ points, max });
  }

  // Fallback: monthly (keeps old behavior if you ever request ?bucket=month)
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
    points[idx][key] += pay.amountCents / 100; // dollars
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
