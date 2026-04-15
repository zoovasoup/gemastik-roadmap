import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	integer,
	boolean,
	index,
	jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const learningRoadmaps = pgTable(
	"learning_roadmaps",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		goalDescription: text("goal_description").notNull(),
		// Logic: Auto-Recalibration state tracking
		currentStatus: text("current_status", {
			enum: ["active", "completed", "recalibrating", "needs_recalibration"],
		}).default("active"),
		// Buat metadata lebih fleksibel dengan Record atau interface yang lebih luas
		metadata: jsonb("metadata").$type<{
			onboarding?: {
				topic: string;
				level: string;
				goal: string;
				weeklyHours: string;
				learningStyle: string;
			};
			originalPrompt?: string;
			aiContext?: string;
			reason?: string;
			lastNode?: string;
			generationStatus?: "generated" | "draft";
		}>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("roadmap_userId_idx").on(table.userId)],
);

export const roadmapNodes = pgTable(
	"roadmap_nodes",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		roadmapId: text("roadmap_id")
			.notNull()
			.references(() => learningRoadmaps.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		orderIndex: integer("order_index").notNull(),
		contentType: text("content_type", {
			enum: ["video", "reading", "hands-on", "socratic"],
		}).notNull(),
		estimatedTime: integer("estimated_time").notNull(),
		successCriteria: jsonb("success_criteria").$type<string[]>().notNull(),
		difficultyLevel: integer("difficulty_level").notNull(),
		isCompleted: boolean("is_completed").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("node_roadmapId_idx").on(table.roadmapId)],
);

export const learningRoadmapsRelations = relations(
	learningRoadmaps,
	({ one, many }) => ({
		user: one(user, {
			fields: [learningRoadmaps.userId],
			references: [user.id],
		}),
		nodes: many(roadmapNodes),
	}),
);

export const roadmapNodesRelations = relations(roadmapNodes, ({ one }) => ({
	roadmap: one(learningRoadmaps, {
		fields: [roadmapNodes.roadmapId],
		references: [learningRoadmaps.id],
	}),
}));
