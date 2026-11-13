// Seeds ~8 fake members for local testing.  Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import { seedMembers } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  for (const m of seedMembers) {
    await prisma.member.upsert({
      where: { email: m.email },
      create: { ...m, consentAt: now },
      update: { ...m, consentAt: now },
    });
  }
  console.log(`Seeded ${seedMembers.length} members.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
