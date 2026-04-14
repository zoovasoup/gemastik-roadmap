import {
	pgTable,
	text,
	timestamp,
	integer,
	jsonb,
	real,
} from "drizzle-orm/pg-core";
import { roadmapNodes } from "./learning";
import { user } from "./auth";

export const socraticSessions = pgTable("socratic_sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	nodeId: text("node_id")
		.notNull()
		.references(() => roadmapNodes.id, { onDelete: "cascade" }),
	// Logic: Diskusi santai buat validasi tanpa kuis kaku [cite: 12]
	chatHistory: jsonb("chat_history")
		.$type<{ role: "user" | "assistant"; content: string }[]>()
		.notNull(),
	competencyScore: integer("competency_score"),
	stumbleCount: integer("stumble_count").default(0).notNull(),
	sentimentScore: real("sentiment_score").default(0).notNull(),
	aiFeedbackSummary: text("ai_feedback_summary"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const microArtifacts = pgTable("micro_artifacts", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	nodeId: text("node_id")
		.notNull()
		.references(() => roadmapNodes.id, { onDelete: "cascade" }),
	artifactUrl: text("artifact_url").notNull(), // Link repo atau file fungsional [cite: 13]
	validationStatus: text("validation_status", {
		enum: ["pending", "verified", "failed"],
	})
		.default("pending")
		.notNull(),
	aiCritique: text("ai_critique"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
