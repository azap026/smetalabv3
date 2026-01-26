-- 0. Extensions
-- CREATE EXTENSION IF NOT EXISTS "pgvector";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "unaccent";--> statement-breakpoint

-- 1. Enums
CREATE TYPE "public"."work_status" AS ENUM('active', 'draft', 'archived', 'deleted');--> statement-breakpoint

-- 2. Works Table
CREATE TABLE "works" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer,
	"code" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"description" text,
	"category" text,
	"subcategory" text,
	"tags" text[],
	"status" "work_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	-- "embedding" vector(1024),
    "search_vector" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(short_description, '')), 'B') ||
        setweight(to_tsvector('russian', coalesce(description, '')), 'C')
    ) STORED,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- 3. Constraints & Relations
ALTER TABLE "works" ADD CONSTRAINT "works_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- 4. Advanced Indexing
-- B-Tree for basic filtering
CREATE INDEX IF NOT EXISTS "works_tenant_status_idx" ON "works" USING btree ("tenant_id") WHERE deleted_at IS NULL AND status = 'active';--> statement-breakpoint
-- Partial unique for work code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "idx_works_code_tenant_unique" ON "works" ("tenant_id", "code") WHERE "deleted_at" IS NULL;--> statement-breakpoint
-- Trigram for fuzzy code search
CREATE INDEX IF NOT EXISTS "idx_works_code_trgm" ON "works" USING gin ("code" gin_trgm_ops);--> statement-breakpoint
-- GIN for tags
CREATE INDEX IF NOT EXISTS "idx_works_tags_gin" ON "works" USING gin ("tags");--> statement-breakpoint
-- Full-text GIN
CREATE INDEX IF NOT EXISTS "works_search_vector_idx" ON "works" USING gin ("search_vector");--> statement-breakpoint
-- HNSW for vector search
-- CREATE INDEX IF NOT EXISTS "works_embedding_hnsw_idx" ON "works" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);--> statement-breakpoint

-- 5. Automations (Triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';--> statement-breakpoint

CREATE TRIGGER trg_works_updated_at
    BEFORE UPDATE ON works
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint

-- 6. Security (RLS)
ALTER TABLE "works" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Policy: Select (Users can see their own data + global data)
CREATE POLICY works_tenant_isolation ON works
    FOR SELECT
    USING (
        tenant_id IS NULL 
        OR 
        tenant_id = (current_setting('app.current_tenant_id', true)::integer)
    );--> statement-breakpoint

-- Policy: All (Users can only modify their own data)
CREATE POLICY works_tenant_modification ON works
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true)::integer))
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true)::integer));