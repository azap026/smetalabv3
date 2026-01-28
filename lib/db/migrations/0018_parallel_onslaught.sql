CREATE INDEX "materials_tenant_unit_idx" ON "materials" USING btree ("tenant_id","unit");--> statement-breakpoint
CREATE INDEX "works_tenant_unit_idx" ON "works" USING btree ("tenant_id","unit");