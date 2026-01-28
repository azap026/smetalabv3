DROP INDEX "materials_name_trgm_idx";--> statement-breakpoint
CREATE INDEX "materials_name_trgm_idx" ON "materials" USING gin ("name" gin_trgm_ops);