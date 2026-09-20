import "dotenv/config";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "./index";

// Applies drizzle/*.sql in order. `drizzle-kit migrate` alone does not
// run migrations — this runner does (`pnpm db:migrate`).
async function main() {
  console.log("Applying migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
