import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { learningRoadmaps, roadmapNodes } from "@gemastik/db/schema/learning";
import { socraticSessions } from "@gemastik/db/schema/validation";
import { nanoid } from "nanoid";

import { aiService } from "../services/ai.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { roadmapService } from "../services/roadmap.service";

const contentTypeSchema = z.enum(["video", "reading", "hands-on", "socratic"]);

const onboardingAnswersSchema = z.object({
  topic: z.string().trim().min(3),
  level: z.string().trim().min(2),
  goal: z.string().trim().min(2),
  weeklyHours: z.string().trim().min(2),
  learningStyle: z.string().trim().min(2),
});

const generatedNodeSchema = z.object({
  title: z.string().trim().min(1),
  difficulty_level: z.coerce.number().int().min(1).max(10),
  estimated_time: z.coerce.number().int().positive(),
  content_type: z.enum(["video", "reading", "hands-on", "socratic", "text", "doc", "hands_on"]),
  success_criteria: z.array(z.string().trim().min(1)).min(1),
});

const tutorMessageSchema = z.object({
	role: z.enum(["user", "assistant"]),
	content: z.string().trim().min(1).max(3000),
});

type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;
type GeneratedNode = z.infer<typeof generatedNodeSchema>;
type RoadmapGenerationStatus = "generated" | "draft";

function buildGoalDescription(input: OnboardingAnswers) {
  return [
    `Learn ${input.topic}.`,
    `Current level: ${input.level}.`,
    `Primary goal: ${input.goal}.`,
    `Weekly commitment: ${input.weeklyHours}.`,
    `Preferred learning style: ${input.learningStyle}.`,
  ].join(" ");
}

function normalizeContentType(value: GeneratedNode["content_type"]): z.infer<typeof contentTypeSchema> {
  if (value === "text" || value === "doc") {
    return "reading";
  }

  if (value === "hands_on") {
    return "hands-on";
  }

  return contentTypeSchema.parse(value);
}

function formatNodesForInsert(nodes: GeneratedNode[], userId: string, roadmapId: string, startIndex = 0) {
  return nodes.map((node, index) => ({
    id: nanoid(),
    userId,
    roadmapId,
    title: node.title,
    difficultyLevel: node.difficulty_level,
    estimatedTime: node.estimated_time,
    contentType: normalizeContentType(node.content_type),
    successCriteria: node.success_criteria,
    orderIndex: startIndex + index,
  }));
}

function buildTutorInstruction({
	goalDescription,
	node,
}: {
	goalDescription: string;
	node: {
		title: string;
		contentType: string;
		difficultyLevel: number;
		estimatedTime: number;
		successCriteria: string[];
	};
}) {
	return [
		"You are a patient learning tutor inside a personalized roadmap app.",
		"The overall learning goal is: " + goalDescription,
		"The active roadmap node is: " + node.title,
		"Node type: " + node.contentType + ". Difficulty: " + node.difficultyLevel + "/10. Estimated time: " + node.estimatedTime + " minutes.",
		"Success criteria: " + node.successCriteria.join("; ") + ".",
		"Help the learner understand the topic, unblock confusion, and propose next steps.",
		"Do not grade them, do not mention competency scores, and do not imply progress was automatically updated.",
		"Keep responses practical, conversational, and grounded in the node context.",
	].join(" ");
}

async function generateNodes(goalDescription: string) {
  const result = await roadmapService.generateInitialRoadmap(goalDescription);
  return z.array(generatedNodeSchema).min(1).max(5).parse(result.nodes);
}

async function createRoadmap({
  ctx,
  goalDescription,
  metadata,
  allowDraftOnGenerationFailure,
}: {
  ctx: { db: typeof import("@gemastik/db").db; user: { id: string } };
  goalDescription: string;
  metadata: Record<string, unknown>;
  allowDraftOnGenerationFailure: boolean;
}) {
  let generationStatus: RoadmapGenerationStatus = "generated";
  let nodes: GeneratedNode[] = [];

  try {
    nodes = await generateNodes(goalDescription);
  } catch (error) {
    if (!allowDraftOnGenerationFailure) {
      throw error;
    }

    generationStatus = "draft";
    console.error("ROADMAP_CREATE_DRAFT_FALLBACK:", error);
  }

  return await ctx.db.transaction(async (tx) => {
    const [roadmap] = await tx
      .insert(learningRoadmaps)
      .values({
        id: nanoid(),
        userId: ctx.user.id,
        goalDescription,
        metadata: {
          ...metadata,
          originalPrompt: goalDescription,
          generationStatus,
        },
      })
      .returning();

    if (!roadmap) {
      throw new Error("Failed to create roadmap: database insert returned no data.");
    }

    if (nodes.length > 0) {
      await tx.insert(roadmapNodes).values(formatNodesForInsert(nodes, ctx.user.id, roadmap.id));
    }

    return {
      roadmapId: roadmap.id,
      generationStatus,
      nodeCount: nodes.length,
    };
  });
}

export const learningRouter = createTRPCRouter({
	create: protectedProcedure
		.input(onboardingAnswersSchema)
		.mutation(async ({ ctx, input }) => {
			const goalDescription = buildGoalDescription(input);

			return await createRoadmap({
				ctx,
				goalDescription,
				metadata: {
					onboarding: input,
				},
				allowDraftOnGenerationFailure: true,
			});
		}),

	generate: protectedProcedure
		.input(z.object({ goal: z.string().min(10) }))
		.mutation(async ({ ctx, input }) => {
			return await createRoadmap({
				ctx,
				goalDescription: input.goal,
				metadata: {},
				allowDraftOnGenerationFailure: false,
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
			const recalibratedRoadmap = await roadmapService.recalibrateRoadmap({
				goal: roadmap.goalDescription,
				failedNodeTitle: failedNodeTitle,
				context: failureContext,
			});
			const adaptedNodes = z.array(generatedNodeSchema).min(1).max(5).parse(recalibratedRoadmap.nodes);

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

				await tx
					.insert(roadmapNodes)
					.values(formatNodesForInsert(adaptedNodes, ctx.user.id, roadmap.id, completedCount));

				// Reset status roadmap jadi active
				await tx
					.update(learningRoadmaps)
					.set({ currentStatus: "active", metadata: {} })
					.where(eq(learningRoadmaps.id, roadmap.id));

				return { success: true };
			});
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.query.learningRoadmaps.findMany({
			where: eq(learningRoadmaps.userId, ctx.user.id),
			orderBy: (roadmap, { desc }) => [desc(roadmap.createdAt)],
			with: {
				nodes: {
					orderBy: (node, { asc }) => [asc(node.orderIndex)],
				},
			},
		});
	}),

	askTutor: protectedProcedure
		.input(
			z.object({
				roadmapId: z.string().min(1),
				nodeId: z.string().min(1),
				messages: z.array(tutorMessageSchema).min(1).max(20),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const roadmap = await ctx.db.query.learningRoadmaps.findFirst({
				where: and(
					eq(learningRoadmaps.id, input.roadmapId),
					eq(learningRoadmaps.userId, ctx.user.id),
				),
			});

			if (!roadmap) {
				throw new Error("Roadmap tidak ditemukan.");
			}

			const node = await ctx.db.query.roadmapNodes.findFirst({
				where: and(
					eq(roadmapNodes.id, input.nodeId),
					eq(roadmapNodes.roadmapId, input.roadmapId),
					eq(roadmapNodes.userId, ctx.user.id),
				),
			});

			if (!node) {
				throw new Error("Node tidak ditemukan.");
			}

			const prompt = input.messages
				.map((message) => `${message.role === "user" ? "Learner" : "Tutor"}: ` + message.content)
				.join("\n");

			const answer = await aiService.generateText(
				prompt,
				buildTutorInstruction({
					goalDescription: roadmap.goalDescription,
					node,
				}),
			);

			return { answer };
		}),

	getDashboard: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.query.learningRoadmaps.findMany({
			where: eq(learningRoadmaps.userId, ctx.user.id),
			orderBy: (roadmap, { desc }) => [desc(roadmap.createdAt)],
			with: {
				nodes: {
					orderBy: (node, { asc }) => [asc(node.orderIndex)],
				},
			},
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
