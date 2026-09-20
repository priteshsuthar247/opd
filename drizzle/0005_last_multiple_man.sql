-- pg_trgm backs the patient-name search index below. IF NOT EXISTS: safe on reruns.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "consultations_followup_idx" ON "consultations" USING btree ("follow_up_required","follow_up_date");--> statement-breakpoint
CREATE INDEX "patients_name_trgm_idx" ON "patients" USING gin ("name" gin_trgm_ops);