import { Router } from "express";
import { prisma } from "../db/prisma";

export const ownerOverview = Router();

/**
 * GET /api/owner/overview/name
 * Returns upcoming payments for the "Name" card.
 * Shape: [{ id, firstName, lastName, description, badge, amountCents }]
 */
ownerOverview.get("/api/owner/overview/name", async (req, res) => {
  const limit = Math.min(
    parseInt(String(req.query.limit ?? "10"), 10) || 10,
    50,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await prisma.payment.findMany({
    take: limit,
    orderBy: [{ status: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: { patient: true },
  });

  type Row = (typeof rows)[number];

  const data = rows.map((p: Row) => {
    const full = `${p.patient.firstName} ${p.patient.lastName}`.trim();
    const badge =
      p.status === "HOLD"
        ? "Hold"
        : p.status === "PAID"
          ? "Paid"
          : p.dueDate >= today &&
              p.dueDate <= new Date(today.getTime() + 86400000 - 1)
            ? "Due Today"
            : "Pending";

    return {
      id: p.id,
      firstName: p.patient.firstName,
      lastName: p.patient.lastName,
      fullName: full,
      description: p.methodLabel ?? "",
      badge,
      amountCents: p.amountCents,
      dueDate: p.dueDate.toISOString(),
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
