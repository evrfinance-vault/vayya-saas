import { addMonths, startOfMonth } from "date-fns";
import type { PrismaClient } from "@prisma/client";

/**
 * Create a plan and its monthly Payment rows in one go.
 * First payment = baseInstallment + downPaymentCents
 * Last payment absorbs any rounding remainder.
 */
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
  },
) {
  const {
    patientId,
    principalCents,
    downPaymentCents,
    termMonths,
    startDate,
    billingDay,
    planType,
    health,
    onHold,
  } = args;

  const financed = principalCents - (downPaymentCents || 0);
  if (termMonths <= 0) throw new Error("termMonths must be >= 1");
  if (financed < 0)
    throw new Error("downPaymentCents cannot exceed principalCents");

  const base = Math.floor(financed / termMonths);
  const remainder = financed - base * termMonths;

  const payments: Array<{
    amountCents: number;
    status: "PENDING";
    dueDate: Date;
    paidAt: Date | null;
    patientId: string;
  }> = [];

  for (let i = 0; i < termMonths; i++) {
    const monthStart = startOfMonth(addMonths(startDate, i));
    const dueDate = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      clampDay(billingDay, monthStart),
    );
    let amount = base;

    if (i === 0) amount += downPaymentCents; // down-payment joins first installment
    if (i === termMonths - 1) amount += remainder; // absorb rounding

    payments.push({
      amountCents: amount,
      status: "PENDING" as const,
      dueDate,
      paidAt: null as Date | null,
      patientId,
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
