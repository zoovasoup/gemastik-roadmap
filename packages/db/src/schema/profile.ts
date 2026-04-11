import {
	pgTable,
	text,
	timestamp,
	integer,
	index,
	jsonb,
	real,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { roadmapNodes } from "./learning";

export const userCognitiveProfiles = pgTable("user_cognitive_profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	preferredFormat: text("preferred_format", {
		enum: ["visual", "textual", "auditory"],
	}).default("textual"),
	avgFocusDuration: integer("avg_focus_duration").default(0), // in minutes
	weakTopics: jsonb("weak_topics").$type<string[]>().default([]),
	lastRecalibrationAt: timestamp("last_recalibration_at"),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const learningLogs = pgTable(
	"learning_logs",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		nodeId: text("node_id")
			.notNull()
			.references(() => roadmapNodes.id),
		timeSpent: integer("time_spent").notNull(), // seconds
		stumbleCount: integer("stumble_count").default(0).notNull(), // Berapa kali nanya/stuck
		sentimentScore: real("sentiment_score"), // Analisis frustasi user [cite: 4]
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("log_userId_idx").on(table.userId),
		index("log_nodeId_idx").on(table.nodeId),
	],
);
