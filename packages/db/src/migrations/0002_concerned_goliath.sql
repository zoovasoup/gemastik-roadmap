CREATE TABLE "tutor_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"node_id" text NOT NULL,
	"chat_history" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "socratic_sessions" ALTER COLUMN "competency_score" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "roadmap_nodes" ADD COLUMN "lesson_content" jsonb;--> statement-breakpoint
ALTER TABLE "roadmap_nodes" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "tutor_sessions" ADD CONSTRAINT "tutor_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_sessions" ADD CONSTRAINT "tutor_sessions_node_id_roadmap_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."roadmap_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tutor_session_user_node_idx" ON "tutor_sessions" USING btree ("user_id","node_id");