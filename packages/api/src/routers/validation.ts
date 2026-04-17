import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { aiService } from "../services/ai.service";
import { roadmapNodes, learningRoadmaps } from "@gemastik/db/schema/learning"; // Tambah learningRoadmaps
import { socraticSessions } from "@gemastik/db/schema/validation";
import { eq as drizzleEq, and as drizzleAnd } from "drizzle-orm";
import { nanoid } from "nanoid";

export const validationRouter = createTRPCRouter({
	submitSocratic: protectedProcedure
		.input(
			z.object({
				nodeId: z.string().min(10),
				message: z.string().min(2),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const node = await ctx.db.query.roadmapNodes.findFirst({
				where: drizzleAnd(
					drizzleEq(roadmapNodes.id, input.nodeId),
					drizzleEq(roadmapNodes.userId, ctx.user.id),
				),
			});

			if (!node) throw new Error("Node tidak ditemukan.");

			let session = await ctx.db.query.socraticSessions.findFirst({
				where: drizzleEq(socraticSessions.nodeId, input.nodeId),
			});

			const updatedHistory = session
				? [
						...(session.chatHistory as any[]),
						{ role: "user", content: input.message },
					]
				: [{ role: "user", content: input.message }];

			const systemInstruction = `
				You are the Socratic Validator for Gradia. Evaluate understanding of "${node.title}".
				Success Criteria: ${node.successCriteria.join("; ")}. 

				Output ONLY raw JSON with this exact schema:
				{
					"ai_response": "string (your socratic response)",
					"competency_score": number (0-100 based on success criteria met),
					"stumble_count": 0 or 1 (1 if user is repeating mistakes or clearly stuck),
					"sentiment_score": number (0.0 to 1.0)
				}

				SCORING RULES for sentiment_score:
				- 0.0: Frustrated, angry, or "I give up" attitude.
				- 0.5: Neutral, factual, or simple answers (Default).
				- 1.0: Excited, motivated, or deep engagement.

				Current user sentiment is crucial. If they are neutral, give 0.5.
			`;

			const aiResult = await aiService.generateStructuredOutput(
				JSON.stringify(updatedHistory),
				systemInstruction,
			);

			return await ctx.db.transaction(async (tx) => {
				const totalStumbles =
					(session?.stumbleCount ?? 0) + (aiResult.stumble_count ?? 0);

				await tx
					.insert(socraticSessions)
					.values({
						id: session?.id ?? nanoid(),
						nodeId: node.id,
						userId: ctx.user.id,
						chatHistory: [
							...updatedHistory,
							{ role: "assistant", content: aiResult.ai_response },
						],
						competencyScore: aiResult.competency_score,
						stumbleCount: totalStumbles,
						sentimentScore: aiResult.sentiment_score ?? 0,
						aiFeedbackSummary: aiResult.ai_response,
					})
					.onConflictDoUpdate({
						target: socraticSessions.id,
						set: {
							chatHistory: [
								...updatedHistory,
								{ role: "assistant", content: aiResult.ai_response },
							],
							competencyScore: aiResult.competency_score,
							stumbleCount: totalStumbles,
							sentimentScore: aiResult.sentiment_score ?? 0,
							aiFeedbackSummary: aiResult.ai_response,
						},
					});

				if (aiResult.competency_score >= 80) {
					await tx
						.update(roadmapNodes)
						.set({ isCompleted: true })
						.where(drizzleEq(roadmapNodes.id, node.id));
				}

				// --- Logic Rekalsibrasi (Threshold: Stumble > 3 atau Sentiment < 0.3) ---
				const isStuck = totalStumbles > 3;
				const isFrustrated = (aiResult.sentiment_score ?? 1) < 0.3;

				if (isStuck || isFrustrated) {
					await tx
						.update(learningRoadmaps)
						.set({
							currentStatus: "needs_recalibration",
							metadata: {
								reason: isStuck ? "cognitive_blockage" : "affective_burnout",
								lastNode: node.title,
							},
						})
						.where(drizzleEq(learningRoadmaps.id, node.roadmapId));

					return { ...aiResult, recalibrationRequired: true };
				}

				return { ...aiResult, recalibrationRequired: false };
			});
		}),
});
