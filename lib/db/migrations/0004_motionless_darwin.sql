CREATE TYPE "public"."rbac_level" AS ENUM('none', 'read', 'manage');--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ADD COLUMN "access_level" "rbac_level" DEFAULT 'manage' NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "access_level" "rbac_level" DEFAULT 'read' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_role_permissions" DROP COLUMN "show_in_ui";--> statement-breakpoint
ALTER TABLE "role_permissions" DROP COLUMN "show_in_ui";