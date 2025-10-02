import { PrismaClient, PlanType, PaymentStatus } from "@prisma/client";
import { addMonths, startOfMonth, setDate, addDays, isBefore } from "date-fns";

const prisma = new PrismaClient();

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.paymentPlan.deleteMany(),
    prisma.patient.deleteMany(),
  ]);

  const [sophia, ava, noah, liam, emma] = await prisma.$transaction([
    prisma.patient.create({
      data: {
        firstName: "Sophia",
        lastName: "Lewis",
        email: "sophia@example.com",
      },
    }),
    prisma.patient.create({
      data: { firstName: "Ava", lastName: "Turner", email: "ava@example.com" },
    }),
    prisma.patient.create({
      data: {
        firstName: "Noah",
        lastName: "Brooks",
        email: "noah@example.com",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "Liam",
        lastName: "Nguyen",
        email: "liam@example.com",
      },
    }),
    prisma.patient.create({
      data: { firstName: "Emma", lastName: "Diaz", email: "emma@example.com" },
    }),
  ]);

  const patients = await prisma.patient.findMany({ select: { id: true } });

  const HEALTH: Array<"EXCELLENT" | "GOOD" | "FAIR" | "POOR"> = [
    "EXCELLENT",
    "GOOD",
    "FAIR",
    "POOR",
  ];

  function pickHealth(): (typeof HEALTH)[number] {
    const bag = ["EXCELLENT", "EXCELLENT", "GOOD", "GOOD", "FAIR", "POOR"];
    return bag[Math.floor(Math.random() * bag.length)] as any;
  }

  const today = new Date();
  const rangeStart = startOfMonth(addMonths(today, -11));
  const DUE_DAYS = [5, 12, 20, 28];

  for (const p of patients) {
    const planCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < planCount; i++) {
      const plan = await prisma.paymentPlan.create({
        data: {
          patientId: p.id,
          principalCents: 50000 + Math.floor(Math.random() * 450000),
          health: pickHealth(),
          planType: pick([PlanType.SELF, PlanType.KAYYA]),
          onHold: Math.random() < 0.12, // ~12% of plans on hold
        },
      });

      const dueDay = pick(DUE_DAYS);

      for (let m = 0; m < 12; m++) {
        const base = addMonths(rangeStart, m);
        const due = setDate(base, dueDay);

        // status logic:
        // - past months: 75% paid, otherwise pending (overdue)
        // - current month: mostly pending, sometimes due today if dates align
        // - future months: pending
        let status = PaymentStatus.PENDING;
        let paidAt: Date | null = null;

        if (isBefore(due, startOfMonth(today))) {
          if (Math.random() < 0.75) {
            status = PaymentStatus.PAID;
            paidAt = addDays(due, Math.floor(Math.random() * 7)); // up to a week after due
          }
        } else if (
          due.getMonth() === today.getMonth() &&
          due.getFullYear() === today.getFullYear()
        ) {
          // leave as PENDING; UI will tag "Due today" if same day
        } else {
          // future: pending
        }

        const amt = 5000 + Math.floor(Math.random() * 25000); // $50–$250
        await prisma.payment.create({
          data: {
            patientId: p.id,
            paymentPlanId: plan.id,
            amountCents: amt,
            status,
            dueDate: due,
            paidAt,
          },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
