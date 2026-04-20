CREATE TABLE "user_sidebar_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hidden_item_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pinned_item_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"item_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"collapsed_sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_sidebar_preferences" ADD CONSTRAINT "user_sidebar_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_sidebar_preferences_user_id_idx" ON "user_sidebar_preferences" USING btree ("user_id");