import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env");
}

const sql = neon(process.env.DATABASE_URL);

// `schema` is passed through so `db.query.<table>.findMany({ with: {...} })`
// relational queries work out of the box in Server Actions.
export const db = drizzle(sql, { schema });
