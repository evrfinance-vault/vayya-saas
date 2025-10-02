import {
  PrismaClient,
  PlanType,
  PlanHealth,
  PaymentStatus,
} from "@prisma/client";
import { startOfMonth, addMonths, addDays, isBefore } from "date-fns";
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

const pick = <T>(arr: readonly T[]) =>
  arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  await prisma.payment.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.patient.deleteMany();

  const PATIENT_COUNT = 36;

  const today = new Date();
  const anchor = startOfMonth(today);

  const patients = [];
  for (let i = 0; i < PATIENT_COUNT; i++) {
    const firstName = pick(FIRSTS);
    const lastName = pick(LASTS);
    patients.push(
      await prisma.patient.create({
        data: { firstName, lastName },
      }),
    );
  }

  for (const pt of patients) {
    const planCount = randInt(1, 2);
    for (let i = 0; i < planCount; i++) {
      const principal = randInt(5_000, 20_000) * 100;
      const down = pick([0, 500, 750, 1_000, 1_500]) * 100;
      const term = pick([6, 9, 12, 18, 24]);
      const billingDay = pick([5, 9, 12, 16, 20, 23, 28]);
      const startMonthsAgo = randInt(0, 14);
      const startDate = addMonths(anchor, -startMonthsAgo);

      const plan = await createPlanWithSchedule(prisma, {
        patientId: pt.id,
        principalCents: principal,
        downPaymentCents: down,
        termMonths: term,
        startDate,
        billingDay,
        planType: Math.random() < 0.5 ? "SELF" : "KAYYA",
        health: pick(["EXCELLENT", "GOOD", "FAIR", "POOR"] as const),
        onHold: Math.random() < 0.12,
      });

      const past = plan.payments.filter((p) => isBefore(p.dueDate, anchor));
      for (const p of past) {
        if (Math.random() < 0.7) {
          const paidAt = addDays(p.dueDate, randInt(0, 6));
          await prisma.payment.update({
            where: { id: p.id },
            data: { status: PaymentStatus.PAID, paidAt },
          });
        }
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seeded with 36 patients, mixed plans & payment history.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
