ALTER TABLE "users" ADD COLUMN "username" varchar(30);--> statement-breakpoint
-- Backfill handles from email prefixes (social-style): sanitize to
-- [a-z0-9._-], first-come keeps the base, later collisions get a numeric
-- suffix. Empty-after-sanitize falls back to user<id>.
WITH based AS (
  SELECT id,
    nullif(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9._-]', '', 'g'), '') AS base
  FROM "users" WHERE username IS NULL
),
ranked AS (
  SELECT id, coalesce(base, 'user' || id) AS base,
    row_number() OVER (PARTITION BY coalesce(base, 'user' || id) ORDER BY id) AS rn
  FROM based
)
UPDATE "users" u SET username = left(CASE WHEN r.rn = 1 THEN r.base ELSE r.base || (r.rn - 1) END, 30)
FROM ranked r WHERE u.id = r.id;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
