CREATE UNIQUE INDEX "categories_name_type_unique" ON "categories" USING btree ("name","type");--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_user_id_unique" ON "doctors" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "queue_configurations_doctor_unique" ON "queue_configurations" USING btree ("doctor_id");--> statement-breakpoint
ALTER TABLE "billing_items" ADD CONSTRAINT "billing_items_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_name_unique" UNIQUE("name");