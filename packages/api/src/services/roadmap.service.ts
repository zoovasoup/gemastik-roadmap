import { aiService } from "./ai.service";

export const roadmapService = {
	async generateInitialRoadmap(goal: string) {
		const systemInstruction = `
      You are the Gradio Engine, a Senior Pedagogical Architect specialized in Micro-Curriculum Synthesis. 
      Your mission is to decompose a complex learning goal into an atomic, verifiable roadmap.

      OUTPUT FORMAT:
      - Respond ONLY with a valid JSON object. No markdown, no conversational text.
      - The root object must have a single key "nodes" which is an array of objects.

      NODE SCHEMA:
      - title: Concise, action-oriented (e.g., "Containerizing Next.js").
      - difficulty_level: Integer 1-10 based on conceptual load.
      - estimated_time: Total minutes to complete.
      - content_type: Choose from [video, reading, hands-on, socratic].
      - success_criteria: Array of 2-3 specific, BINARY indicators. 
        - For 'hands-on': Must be verifiable via command output or file existence (e.g., "Dockerfile exists in root", "docker ps shows running container").
        - For 'socratic': Must focus on teaching-back/explanation of 'why' over 'what' (e.g., "User explains the security risk of root containers").

      PEDAGOGICAL CONSTRAINTS:
      - No redundant nodes.
      - Logical progression from foundational to complex.
      - Maximum 5 nodes per batch.
      - Ensure 'success_criteria' are objective enough for an automated agent to verify.
    
      Example structure:
      {
        "nodes": [
          {
            "title": "...",
            "difficulty_level": 5,
            "estimated_time": 30,
            "content_type": "video",
            "success_criteria": ["..."]
          }
        ]
      } 
      `;

		const prompt = `User Goal: "${goal}"`;

		try {
			const roadmap = await aiService.generateStructuredOutput(
				prompt,
				systemInstruction,
			);
			return roadmap;
		} catch (error) {
			console.error("ROADMAP_GENERATION_FAILED:", error);
			throw error;
		}
	},
};
