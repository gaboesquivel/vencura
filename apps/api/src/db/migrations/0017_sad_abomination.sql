ALTER TABLE "users" ADD COLUMN "dynamic_user_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_dynamic_user_id_unique" UNIQUE("dynamic_user_id");