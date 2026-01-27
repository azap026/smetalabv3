DROP INDEX IF EXISTS "works_code_tenant_idx";--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "phase" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_works_code_tenant_unique" ON "works" USING btree ("tenant_id","code") WHERE deleted_at IS NULL;