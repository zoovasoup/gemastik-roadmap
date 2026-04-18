import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const userSidebarPreferences = pgTable(
	"user_sidebar_preferences",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		hiddenItemIds: jsonb("hidden_item_ids")
			.$type<string[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),
		pinnedItemIds: jsonb("pinned_item_ids")
			.$type<string[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),
		itemOrder: jsonb("item_order")
			.$type<string[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),
		collapsedSections: jsonb("collapsed_sections")
			.$type<string[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [uniqueIndex("user_sidebar_preferences_user_id_idx").on(table.userId)],
);
