import { Router } from "express";
import { prisma } from "../db/prisma";

export const ownerOverview = Router();

/**
 * GET /api/owner/overview/name
 * Returns upcoming payments for the "Name" card.
 * Shape: [{ id, firstName, lastName, description, badge, amountCents }]
 */
ownerOverview.get("/api/owner/overview/name", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10) || 10, 50);
  const today = new Date(); today.setHours(0,0,0,0);

  const rows = await prisma.payment.findMany({
    take: limit,
    orderBy: [{ status: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: { patient: true },
  });

  const data = rows.map(p => {
    const full = `${p.patient.firstName} ${p.patient.lastName}`.trim();
    const badge =
      p.status === "HOLD"    ? "Hold" :
      p.status === "PAID"    ? "Paid" :
      p.dueDate >= today && p.dueDate <= new Date(today.getTime() + 86400000 - 1) ? "Due Today" :
      "Pending";

    return {
      id: p.id,
      firstName: p.patient.firstName,
      lastName: p.patient.lastName,
      fullName: full,
      description: p.methodLabel ?? "",
      badge,
      amountCents: p.amountCents,
      dueDate: p.dueDate.toISOString()
    };
  });

  res.json({ items: data });
});
