CREATE INDEX "activity_logs_user_timestamp_idx" ON "activity_logs" USING btree ("user_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "teams_created_at_idx" ON "teams" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "works_name_trgm_idx" ON "works" USING gin ("name" gin_trgm_ops);