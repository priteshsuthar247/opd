import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env");
}

// Pooled driver (WebSocket) instead of neon-http: required so
// `db.transaction()` + `SELECT ... FOR UPDATE` row locks work for
// concurrency-safe token assignment (Spec Section 8).
neonConfig.webSocketConstructor = ws;

// Bounded pool: serverless bursts must not exhaust Neon connections.
// Single-flight clinic traffic never needs more than a handful.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// `schema` is passed through so `db.query.<table>.findMany({ with: {...} })`
// relational queries work out of the box in Server Actions.
export const db = drizzle(pool, { schema });
