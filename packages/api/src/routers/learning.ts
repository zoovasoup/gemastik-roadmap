import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { roadmapService } from "../services/roadmap.service";
import { learningRoadmaps, roadmapNodes } from "@gemastik/db/schema/learning";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";
import { socraticSessions } from "@gemastik/db/schema/validation";

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
					roadmapId: roadmap.id,
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

	recalibrate: protectedProcedure
		.input(z.object({ roadmapId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// 1. Ambil data roadmap dan node yang belum selesai
			const roadmap = await ctx.db.query.learningRoadmaps.findFirst({
				where: and(
					eq(learningRoadmaps.id, input.roadmapId),
					eq(learningRoadmaps.userId, ctx.user.id),
				),
				with: {
					nodes: true,
				},
			});

			if (!roadmap || roadmap.currentStatus !== "needs_recalibration") {
				throw new Error(
					"Roadmap tidak ditemukan atau tidak dalam status butuh rekalibrasi.",
				);
			}

			// 2. Ambil konteks kegagalan (lastNode dari metadata)
			const failedNodeTitle = (roadmap.metadata as any)?.lastNode;
			const failedNode = roadmap.nodes.find((n) => n.title === failedNodeTitle);

			let failureContext = "";
			if (failedNode) {
				const session = await ctx.db.query.socraticSessions.findFirst({
					where: eq(socraticSessions.nodeId, failedNode.id),
				});
				failureContext = JSON.stringify(session?.chatHistory ?? []);
			}

			// 3. Sintesis jalur alternatif via roadmapService
			const { nodes: adaptedNodes } = await roadmapService.recalibrateRoadmap({
				goal: roadmap.goalDescription,
				failedNodeTitle: failedNodeTitle,
				context: failureContext,
			});

			// 4. Transaction: Replace incomplete nodes
			return await ctx.db.transaction(async (tx) => {
				// Hapus node yang belum kelar
				await tx
					.delete(roadmapNodes)
					.where(
						and(
							eq(roadmapNodes.roadmapId, roadmap.id),
							eq(roadmapNodes.isCompleted, false),
						),
					);

				const completedCount = roadmap.nodes.filter(
					(n) => n.isCompleted,
				).length;

				const nodesToInsert = adaptedNodes.map((node: any, index: number) => ({
					id: nanoid(),
					userId: ctx.user.id,
					roadmapId: roadmap.id,
					title: node.title,
					difficultyLevel: node.difficulty_level,
					estimatedTime: node.estimated_time,
					contentType: node.content_type,
					successCriteria: node.success_criteria,
					orderIndex: completedCount + index,
				}));

				await tx.insert(roadmapNodes).values(nodesToInsert);

				// Reset status roadmap jadi active
				await tx
					.update(learningRoadmaps)
					.set({ currentStatus: "active", metadata: {} })
					.where(eq(learningRoadmaps.id, roadmap.id));

				return { success: true };
			});
		}),

	getDashboard: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.query.learningRoadmaps.findMany({
			where: eq(learningRoadmaps.userId, ctx.user.id),
			orderBy: (roadmap, { desc }) => [desc(roadmap.createdAt)],
		});
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const data = await ctx.db.query.learningRoadmaps.findFirst({
				where: and(
					eq(learningRoadmaps.id, input.id),
					eq(learningRoadmaps.userId, ctx.user.id),
				),
				with: {
					nodes: {
						orderBy: (node, { asc }) => [asc(node.orderIndex)],
					},
				},
			});

			if (!data) throw new Error("Roadmap tidak ditemukan.");
			return data;
		}),
});
