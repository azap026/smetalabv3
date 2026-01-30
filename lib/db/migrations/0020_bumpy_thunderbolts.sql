-- 1. Convert ID to UUID with cast
ALTER TABLE "materials" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
ALTER TABLE "materials" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "works" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
ALTER TABLE "works" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- 2. Add search_vector as GENERATED columns
-- We drop and recreate to ensure the generation logic is correct and STORED
ALTER TABLE "works" DROP COLUMN IF EXISTS "search_vector";
ALTER TABLE "works" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('russian', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(description, '')), 'C')
) STORED;

ALTER TABLE "materials" DROP COLUMN IF EXISTS "search_vector";
ALTER TABLE "materials" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('russian', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(description, '')), 'B')
) STORED;

-- 3. Add Indices
CREATE INDEX IF NOT EXISTS "materials_search_idx" ON "materials" USING gin ("search_vector");
CREATE INDEX IF NOT EXISTS "works_search_idx" ON "works" USING gin ("search_vector");

-- 4. Add Triggers for updated_at
-- materials trigger
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_materials_updated_at') THEN
        CREATE TRIGGER trg_materials_updated_at
            BEFORE UPDATE ON materials
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- works trigger (ensure it exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_works_updated_at') THEN
        CREATE TRIGGER trg_works_updated_at
            BEFORE UPDATE ON works
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;