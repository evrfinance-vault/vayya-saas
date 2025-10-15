import { addMonths, startOfMonth } from "date-fns";
import type { PrismaClient } from "@prisma/client";

export async function createPlanWithSchedule(
  prisma: PrismaClient,
  args: {
    patientId: string;
    principalCents: number;
    downPaymentCents: number;
    termMonths: number;
    startDate: Date;
    billingDay: number;
    planType: "SELF" | "KAYYA";
    health: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    onHold?: boolean;
    aprBps?: number;
  },
) {
  const {
    patientId,
    principalCents,
    downPaymentCents = 0,
    termMonths,
    startDate,
    billingDay,
    planType,
    health,
    onHold,
    aprBps = 0,
  } = args;

  const financed = Math.max(0, principalCents - downPaymentCents);
  const totalInterest = Math.round(financed * aprBps / 10000);
  const totalRepay = financed + totalInterest;
  const base = Math.floor(totalRepay / termMonths);
  const remainder = totalRepay - base * termMonths;

  if (termMonths <= 0) throw new Error("termMonths must be >= 1");
  if (financed < 0) throw new Error("downPaymentCents cannot exceed principalCents");

  const payments: Array<{
    amountCents: number;
    status: "PENDING";
    dueDate: Date;
    paidAt: Date | null;
    patientId: string;
    lateFeeCents: number;
  }> = [];

  for (let i = 0; i < termMonths; i++) {
    const monthStart = startOfMonth(addMonths(startDate, i));
    const dueDate = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      clampDay(billingDay, monthStart),
    );
    let amount = base;

    if (i === 0) amount += downPaymentCents;
    if (i === termMonths - 1) amount += remainder;

    payments.push({
      amountCents: amount,
      status: "PENDING" as const,
      dueDate,
      paidAt: null as Date | null,
      patientId,
      lateFeeCents: 0,
    });
  }

  return prisma.paymentPlan.create({
    data: {
      patientId,
      principalCents,
      downPaymentCents,
      termMonths,
      startDate,
      billingDay,
      planType,
      health,
      onHold: !!onHold,
      aprBps,
      payments: {
        createMany: { data: payments },
      },
    },
    include: { payments: true },
  });
}

function clampDay(day: number, monthStart: Date) {
  const last = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  return Math.max(1, Math.min(day, last));
}
