ALTER TABLE "learning_roadmaps" ALTER COLUMN "current_status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roadmap_nodes" ALTER COLUMN "difficulty_level" SET DATA TYPE integer USING CASE WHEN "difficulty_level" ~ '^[0-9]+$' THEN "difficulty_level"::integer ELSE 1 END;--> statement-breakpoint
ALTER TABLE "socratic_sessions" ALTER COLUMN "competency_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "roadmap_nodes" ADD COLUMN IF NOT EXISTS "estimated_time" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "roadmap_nodes" ALTER COLUMN "estimated_time" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "roadmap_nodes" ADD COLUMN IF NOT EXISTS "success_criteria" jsonb NOT NULL DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "roadmap_nodes" ALTER COLUMN "success_criteria" TYPE jsonb USING CASE WHEN "success_criteria" IS NULL OR btrim("success_criteria"::text, '"') = '' THEN '[]'::jsonb WHEN left(btrim("success_criteria"::text, '"'), 1) = '[' THEN btrim("success_criteria"::text, '"')::jsonb ELSE jsonb_build_array(btrim("success_criteria"::text, '"')) END;--> statement-breakpoint
ALTER TABLE "socratic_sessions" ADD COLUMN "stumble_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "socratic_sessions" ADD COLUMN "sentiment_score" real DEFAULT 0 NOT NULL;
