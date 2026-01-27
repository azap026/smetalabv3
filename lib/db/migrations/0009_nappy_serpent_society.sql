DROP INDEX "idx_works_code_tenant_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_works_code_tenant_unique" ON "works" USING btree ("tenant_id","code");