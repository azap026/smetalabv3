CREATE TABLE "materials" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer,
	"code" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"unit" varchar(20),
	"price" integer,
	"short_description" text,
	"description" text,
	"category" text,
	"subcategory" text,
	"tags" text[],
	"status" "work_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"embedding" vector(1536),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materials_tenant_status_idx" ON "materials" USING btree ("tenant_id") WHERE deleted_at IS NULL AND status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_materials_code_tenant_unique" ON "materials" USING btree ("tenant_id","code");