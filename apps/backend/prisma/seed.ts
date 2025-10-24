import {
  PrismaClient,
  PlanType,
  PlanHealth,
  PaymentStatus,
  ApplicationStatus,
} from "@prisma/client";
import { startOfMonth, addMonths, addDays, isBefore, subDays } from "date-fns";
import { createPlanWithSchedule } from "../src/lib/schedule";

const prisma = new PrismaClient();

const FIRSTS = [
  "John",
  "Sophia",
  "Benjamin",
  "Ava",
  "Liam",
  "Noah",
  "Emma",
  "Mia",
  "Oliver",
  "Lucas",
  "Isabella",
  "Ethan",
  "Amelia",
  "Harper",
  "Elijah",
  "Henry",
  "James",
  "Mila",
  "Charlotte",
  "Levi",
  "Aria",
  "William",
  "Jack",
  "Luna",
  "Chloe",
  "Layla",
  "Evelyn",
  "Scarlett",
  "Ella",
  "Aiden",
  "Zoe",
  "Hannah",
  "Grace",
  "Penelope",
  "Nora",
  "Sebastian",
];
const LASTS = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await prisma.payment.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.application.deleteMany();
  await prisma.patient.deleteMany();

  const PATIENT_COUNT = 36;
  const today = new Date();
  const anchor = startOfMonth(today);

  const patients = [];
  for (let i = 0; i < PATIENT_COUNT; i++) {
    const firstName = pick(FIRSTS);
    const lastName = pick(LASTS);
    patients.push(
      await prisma.patient.create({ data: { firstName, lastName } }),
    );
  }

  for (const pt of patients) {
    const planCount = randInt(1, 2);

    for (let i = 0; i < planCount; i++) {
      const principal = randInt(5_000, 20_000) * 100;
      const down = pick([0, 500, 750, 1_000, 1_500]) * 100;
      const term = pick([6, 9, 12, 18, 24]);
      const billingDay = pick([5, 9, 12, 16, 20, 23, 28]);

      const startMonthsAgo =
        Math.random() < 0.6 ? randInt(0, 11) : randInt(12, 23);
      const startDate = addMonths(anchor, -startMonthsAgo);

      const type: PlanType = Math.random() < 0.5 ? "SELF" : "KAYYA";
      const aprBps = pick([999, 1299, 1499, 1799, 1999]);

      const plan = await createPlanWithSchedule(prisma, {
        patientId: pt.id,
        principalCents: principal,
        downPaymentCents: down,
        termMonths: term,
        startDate,
        billingDay,
        planType: type,
        health: pick([
          "EXCELLENT",
          "EXCELLENT",
          "EXCELLENT",
          "EXCELLENT",
          "GOOD",
          "GOOD",
          "GOOD",
          "FAIR",
          "FAIR",
          "POOR",
        ] as const),
        onHold: Math.random() < 0.01,
        aprBps,
      });

      const past = plan.payments.filter((p) => isBefore(p.dueDate, anchor));
      for (const p of past) {
        const roll = Math.random();
        if (roll < 0.9) {
          const paidAt = addDays(p.dueDate, randInt(-1, 0));
          await prisma.payment.update({
            where: { id: p.id },
            data: {
              status: PaymentStatus.PAID,
              paidAt,
              lateFeeCents: 0,
            },
          });
        } else if (roll < 0.98) {
          const paidAt = addDays(p.dueDate, randInt(1, 3));
          await prisma.payment.update({
            where: { id: p.id },
            data: {
              status: PaymentStatus.PAID,
              paidAt,
              lateFeeCents: 0,
            },
          });
        } else if (roll < 0.995) {
          const paidAt = addDays(p.dueDate, randInt(5, 10));
          await prisma.payment.update({
            where: { id: p.id },
            data: {
              status: PaymentStatus.PAID,
              paidAt,
              lateFeeCents: 2500,
            },
          });
        }
      }

      await prisma.application.create({
        data: {
          patientId: pt.id,
          paymentPlanId: plan.id,
          amountCents: principal,
          planType: type,
          status: ApplicationStatus.DONE,
          creditScore: randInt(630, 800),
          submittedAt: subDays(startDate, randInt(3, 20)),
        },
      });
    }

    const extraApps = randInt(0, 2);
    for (let j = 0; j < extraApps; j++) {
      const aType: PlanType = Math.random() < 0.5 ? "SELF" : "KAYYA";
      const aStatus = pick([
        ApplicationStatus.PENDING,
        ApplicationStatus.PENDING,
        ApplicationStatus.PAID,
        ApplicationStatus.PAID,
        ApplicationStatus.SENT,
        ApplicationStatus.SENT,
        ApplicationStatus.CONTACTED,
        ApplicationStatus.FAILED,
      ] as const);

      await prisma.application.create({
        data: {
          patientId: pt.id,
          amountCents: randInt(6_000, 25_000) * 100,
          planType: aType,
          status: aStatus,
          creditScore: aStatus === "SENT" ? null : randInt(610, 790),
          submittedAt: subDays(today, randInt(0, 45)),
        },
      });
    }
  }

  await prisma.businessProfile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: "Acme Dental Studio",
      address: "123 Main St, Springfield, USA",
      hours: "Mon–Fri 8am–6pm",
      website: "https://acmedental.example",
      services: ["Implants", "Whitening", "Aligners"],
      financingOptions: ["Self-financed plans", "Kayya-backed plans"],
      testimonials: [
        { author: "Maria G.", quote: "Payment plan made it possible." },
        { author: "D. Patel", quote: "Fast approval, fair terms." },
      ],
    },
    update: {},
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(
      "✅ Seeded patients, plans/payments, and applications with lower delinquency.",
    );
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
