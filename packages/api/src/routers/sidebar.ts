import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { userSidebarPreferences } from "@gemastik/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const preferencesInput = z.object({
	hiddenItemIds: z.array(z.string()).default([]),
	pinnedItemIds: z.array(z.string()).default([]),
	itemOrder: z.array(z.string()).default([]),
	collapsedSections: z.array(z.string()).default([]),
});

export const sidebarRouter = createTRPCRouter({
	getPreferences: protectedProcedure.query(async ({ ctx }) => {
		const preferences = await ctx.db.query.userSidebarPreferences.findFirst({
			where: eq(userSidebarPreferences.userId, ctx.user.id),
		});

		return (
			preferences ?? {
				hiddenItemIds: [],
				pinnedItemIds: [],
				itemOrder: [],
				collapsedSections: [],
			}
		);
	}),

	updatePreferences: protectedProcedure
		.input(preferencesInput)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.userSidebarPreferences.findFirst({
				where: eq(userSidebarPreferences.userId, ctx.user.id),
			});

			await ctx.db
				.insert(userSidebarPreferences)
				.values({
					id: existing?.id ?? nanoid(),
					userId: ctx.user.id,
					...input,
				})
				.onConflictDoUpdate({
					target: userSidebarPreferences.userId,
					set: {
						...input,
					},
				});

			return { success: true };
		}),
});
