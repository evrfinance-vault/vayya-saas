import { Router } from "express";
import { prisma } from "../db/prisma";
import { startOfMonth, addMonths, format, isSameDay } from "date-fns";

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
      OR: [
        { status: "PENDING" }, // upcoming / overdue
        { paymentPlan: { onHold: true } }, // plan on hold
      ],
      // only from last month onward to keep it fresh
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

// GET /api/owner/overview/revenue-by-plan?months=12
ownerOverview.get("/api/owner/overview/revenue-by-plan", async (req, res) => {
  const months = Math.max(1, Math.min(36, Number(req.query.months ?? 12)));
  const now = new Date();
  const start = startOfMonth(addMonths(now, -(months - 1)));

  // get paid payments in range with plan type
  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: start, lte: now } },
    include: { paymentPlan: { select: { planType: true } } },
  });

  // bucket per month
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
  res.json({ points, max });
});
