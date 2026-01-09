import "dotenv/config";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminEmail = "admin@biblequiz.com";

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword("admin123");

    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
    });

    console.log("Created admin user:");
    console.log("  Email: admin@biblequiz.com");
    console.log("  Password: admin123");
  } else {
    console.log("Admin user already exists");
  }

  // Create test user
  const testEmail = "user@biblequiz.com";

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  });

  if (!existingUser) {
    const hashedPassword = await hashPassword("user123");

    await db.insert(users).values({
      email: testEmail,
      password: hashedPassword,
      name: "Test User",
      role: "user",
    });

    console.log("Created test user:");
    console.log("  Email: user@biblequiz.com");
    console.log("  Password: user123");
  } else {
    console.log("Test user already exists");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
