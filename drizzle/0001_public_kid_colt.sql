CREATE TYPE "public"."notification_status" AS ENUM('unread', 'read');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer,
	"appointment_id" integer,
	"type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"status" "notification_status" DEFAULT 'unread' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_appointment_idx" ON "notifications" USING btree ("appointment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_doctor_date_token_unique" ON "appointments" USING btree ("doctor_id","date","token_number");--> statement-breakpoint
CREATE INDEX "appointments_doctor_date_status_idx" ON "appointments" USING btree ("doctor_id","date","status");