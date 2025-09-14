import { PrismaClient, Role, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // Seed Acme tenant
  await prisma.tenant.create({
    data: {
      name: "Acme",
      slug: "acme",
      plan: Plan.FREE,
      users: {
        create: [
          {
            email: "admin@acme.test",
            password: hash("password"),
            role: Role.ADMIN,
            plan: Plan.PRO, // Admin is PRO
          },
          {
            email: "user@acme.test",
            password: hash("password"),
            role: Role.MEMBER,
            plan: Plan.FREE, // Member stays FREE
          },
        ],
      },
    },
  });

  // Seed Globex tenant
  await prisma.tenant.create({
    data: {
      name: "Globex",
      slug: "globex",
      plan: Plan.FREE,
      users: {
        create: [
          {
            email: "admin@globex.test",
            password: hash("password"),
            role: Role.ADMIN,
            plan: Plan.PRO, // Admin is PRO
          },
          {
            email: "user@globex.test",
            password: hash("password"),
            role: Role.MEMBER,
            plan: Plan.FREE,
          },
        ],
      },
    },
  });

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
