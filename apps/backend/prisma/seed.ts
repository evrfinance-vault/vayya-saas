import { PrismaClient } from "@prisma/client"; // ⬅️ drop PaymentStatus import

const prisma = new PrismaClient();

function daysFromNow(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  await prisma.payment.deleteMany();
  await prisma.patient.deleteMany();

  const [sophia, ava, noah, liam, emma] = await prisma.$transaction([
    prisma.patient.create({ data: { firstName: "Sophia", lastName: "Lewis",  email: "sophia@example.com" } }),
    prisma.patient.create({ data: { firstName: "Ava",    lastName: "Turner", email: "ava@example.com" } }),
    prisma.patient.create({ data: { firstName: "Noah",   lastName: "Brooks", email: "noah@example.com" } }),
    prisma.patient.create({ data: { firstName: "Liam",   lastName: "Nguyen", email: "liam@example.com" } }),
    prisma.patient.create({ data: { firstName: "Emma",   lastName: "Diaz",   email: "emma@example.com" } }),
  ]);

  await prisma.$transaction([
    prisma.payment.create({ data: {
      patientId: sophia.id,
      dueDate: daysFromNow(2),
      amountCents: 5800,
      status: "HOLD",            // ← enum as string literal
      methodLabel: "Self-Financed",
      holdReason: "Manual review",
    }}),
    prisma.payment.create({ data: {
      patientId: ava.id,
      dueDate: daysFromNow(0),
      amountCents: 12000,
      status: "PENDING",
      methodLabel: "Self-Financed",
    }}),
    prisma.payment.create({ data: {
      patientId: noah.id,
      dueDate: daysFromNow(3),
      amountCents: 7400,
      status: "PENDING",
      methodLabel: "Kayya-Backed",
    }}),
    prisma.payment.create({ data: {
      patientId: liam.id,
      dueDate: daysFromNow(-1),
      amountCents: 9200,
      status: "PAID",
      methodLabel: "Self-Financed",
    }}),
    prisma.payment.create({ data: {
      patientId: emma.id,
      dueDate: daysFromNow(5),
      amountCents: 4300,
      status: "HOLD",
      methodLabel: "Kayya-Backed",
    }}),
  ]);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
