CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE TYPE "public"."access_level" AS ENUM('view', 'comment', 'download');--> statement-breakpoint
CREATE TYPE "public"."permission_scope" AS ENUM('platform', 'tenant');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('superadmin', 'support');--> statement-breakpoint
CREATE TYPE "public"."rbac_level" AS ENUM('none', 'read', 'manage');--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('admin', 'estimator', 'manager');--> statement-breakpoint
CREATE TYPE "public"."work_status" AS ENUM('active', 'draft', 'archived', 'deleted');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "estimate_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"estimate_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"access_level" "access_level" DEFAULT 'view' NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"last_accessed_at" timestamp,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estimate_shares_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "impersonation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"superadmin_user_id" integer NOT NULL,
	"target_team_id" integer NOT NULL,
	"session_token" varchar(64) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"ip_address" varchar(45),
	CONSTRAINT "impersonation_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "tenant_role" NOT NULL,
	"invited_by" integer NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer,
	"code" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"unit" varchar(20),
	"price" integer,
	"vendor" text,
	"weight" text,
	"category_lv1" text,
	"category_lv2" text,
	"category_lv3" text,
	"category_lv4" text,
	"product_url" text,
	"image_url" text,
	"description" text,
	"tags" text[],
	"status" "work_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"embedding" vector(1536),
	"search_vector" "tsvector",
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(80) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"scope" "permission_scope" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "platform_role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_role" "platform_role" NOT NULL,
	"permission_id" integer NOT NULL,
	"access_level" "rbac_level" DEFAULT 'manage' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "tenant_role" NOT NULL,
	"permission_id" integer NOT NULL,
	"access_level" "rbac_level" DEFAULT 'read' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" "tenant_role" NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"plan_name" varchar(50),
	"subscription_status" varchar(20),
	CONSTRAINT "teams_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "teams_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"platform_role" "platform_role",
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer,
	"code" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"unit" varchar(20),
	"price" integer,
	"short_description" text,
	"description" text,
	"phase" text,
	"category" text,
	"subcategory" text,
	"tags" text[],
	"sort_order" double precision DEFAULT 0 NOT NULL,
	"status" "work_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"embedding" vector(1536),
	"search_vector" "tsvector",
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_shares" ADD CONSTRAINT "estimate_shares_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_shares" ADD CONSTRAINT "estimate_shares_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_superadmin_user_id_users_id_fk" FOREIGN KEY ("superadmin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_team_id_teams_id_fk" FOREIGN KEY ("target_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_user_timestamp_idx" ON "activity_logs" USING btree ("user_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "estimate_shares_team_estimate_idx" ON "estimate_shares" USING btree ("team_id","estimate_id");--> statement-breakpoint
CREATE INDEX "estimate_shares_expires_idx" ON "estimate_shares" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "materials_tenant_status_idx" ON "materials" USING btree ("tenant_id") WHERE deleted_at IS NULL AND status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_materials_code_tenant_unique" ON "materials" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "materials_name_trgm_idx" ON "materials" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "materials_embedding_hnsw_idx" ON "materials" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "materials_tenant_unit_idx" ON "materials" USING btree ("tenant_id","unit");--> statement-breakpoint
CREATE INDEX "materials_search_idx" ON "materials" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_role_permissions_unique" ON "platform_role_permissions" USING btree ("platform_role","permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_unique" ON "role_permissions" USING btree ("role","permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_active_unique" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "teams_created_at_idx" ON "teams" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "works_tenant_status_idx" ON "works" USING btree ("tenant_id") WHERE deleted_at IS NULL AND status = 'active';--> statement-breakpoint
CREATE INDEX "works_sort_order_idx" ON "works" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_works_code_tenant_unique" ON "works" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "works_embedding_hnsw_idx" ON "works" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "works_tenant_unit_idx" ON "works" USING btree ("tenant_id","unit");--> statement-breakpoint
CREATE INDEX "works_name_trgm_idx" ON "works" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "works_search_idx" ON "works" USING gin ("search_vector");