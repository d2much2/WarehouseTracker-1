import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function createAdmin() {
  const username = "admin-brad";
  const password = "admin1234";
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      username,
      passwordHash,
      firstName: "Brad",
      lastName: "Admin",
      role: "admin",
    });
    console.log("✓ Admin user created successfully");
    console.log("  Username:", username);
    console.log("  Password:", password);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  process.exit(0);
}

createAdmin();
