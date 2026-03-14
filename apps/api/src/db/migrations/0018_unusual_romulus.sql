CREATE TABLE "custodial_wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"address" text NOT NULL,
	"encrypted_private_key" text NOT NULL,
	"chain_id" integer DEFAULT 11155111 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custodial_wallets" ADD CONSTRAINT "custodial_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custodial_wallets_user_id_idx" ON "custodial_wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custodial_wallets_address_idx" ON "custodial_wallets" USING btree ("address");