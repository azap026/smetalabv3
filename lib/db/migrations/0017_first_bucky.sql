ALTER TABLE "works" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "sort_order" double precision NOT NULL DEFAULT 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "works_sort_order_idx" ON "works" ("sort_order");