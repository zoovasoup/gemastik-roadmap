import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { roadmapService } from "../services/roadmap.service";
import { learningRoadmaps, roadmapNodes } from "@gemastik/db/schema/learning";
import { nanoid } from "nanoid";

export const learningRouter = createTRPCRouter({
	generate: protectedProcedure
		.input(z.object({ goal: z.string().min(10) }))
		.mutation(async ({ ctx, input }) => {
			// 1. Trigger Micro-Curriculum Synthesis via Gemini
			const { nodes } = await roadmapService.generateInitialRoadmap(input.goal);

			// 2. Database Transaction: Atomic insert buat roadmap & nodes
			return await ctx.db.transaction(async (tx) => {
				// Simpan entitas roadmap utama [cite: 106]
				const [roadmap] = await tx
					.insert(learningRoadmaps)
					.values({
						id: nanoid(),
						userId: ctx.user.id,
						goalDescription: input.goal,
					})
					.returning();

				// Validasi eksplisit untuk memuaskan TypeScript dan menjaga integritas data
				if (!roadmap) {
					throw new Error(
						"Failed to create roadmap: Database insert returned no data.",
					);
				}

				// Mapping output AI ke skema database roadmap_nodes
				const nodesToInsert = nodes.map((node: any, index: number) => ({
					id: nanoid(),
					userId: ctx.user.id,
					goalId: roadmap.id,
					title: node.title,
					difficultyLevel: node.difficulty_level,
					estimatedTime: node.estimated_time,
					contentType: node.content_type,
					successCriteria: node.success_criteria,
					orderIndex: index,
				}));

				await tx.insert(roadmapNodes).values(nodesToInsert);

				return { roadmapId: roadmap.id };
			});
		}),
});
