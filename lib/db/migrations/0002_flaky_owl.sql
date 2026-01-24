CREATE TYPE "public"."access_level" AS ENUM('view', 'comment', 'download');--> statement-breakpoint
CREATE TYPE "public"."permission_scope" AS ENUM('platform', 'tenant');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('superadmin', 'support');--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('admin', 'estimator', 'manager');--> statement-breakpoint
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
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "tenant_role" NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
UPDATE "invitations" SET "role" = 'admin' WHERE "role" = 'owner';
UPDATE "invitations" SET "role" = 'manager' WHERE "role" = 'member';
ALTER TABLE "invitations" ALTER COLUMN "role" SET DATA TYPE "public"."tenant_role" USING "role"::"public"."tenant_role";--> statement-breakpoint
UPDATE "team_members" SET "role" = 'admin' WHERE "role" = 'owner';
UPDATE "team_members" SET "role" = 'manager' WHERE "role" = 'member';
ALTER TABLE "team_members" ALTER COLUMN "role" SET DATA TYPE "public"."tenant_role" USING "role"::"public"."tenant_role";--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "left_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "platform_role" "platform_role";--> statement-breakpoint
ALTER TABLE "estimate_shares" ADD CONSTRAINT "estimate_shares_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_shares" ADD CONSTRAINT "estimate_shares_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_superadmin_user_id_users_id_fk" FOREIGN KEY ("superadmin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_team_id_teams_id_fk" FOREIGN KEY ("target_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estimate_shares_team_estimate_idx" ON "estimate_shares" USING btree ("team_id","estimate_id");--> statement-breakpoint
CREATE INDEX "estimate_shares_expires_idx" ON "estimate_shares" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_role_permissions_unique" ON "platform_role_permissions" USING btree ("platform_role","permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_unique" ON "role_permissions" USING btree ("role","permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_active_unique" ON "team_members" USING btree ("team_id","user_id");