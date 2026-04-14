import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@gemastik/env/server";

// Inisialisasi SDK dengan API Key dari env package
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const aiService = {
	/**
	 * Function inti buat komunikasi sama Gemini.
	 * Pakai model gemini-2.5-flash buat latency yang lebih rendah di Free Tier.
	 */
	async generateStructuredOutput(prompt: string, systemInstruction?: string) {
		try {
			const model = genAI.getGenerativeModel({
				model: "gemini-2.5-flash", // Model yang dipilih untuk latency rendah
				systemInstruction: systemInstruction,
			});

			// Pakai Response Schema kalau mau lebih strict (optional di SDK terbaru)
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			// Logic buat bersihin markdown backticks kalo AI-nya bandel ngasih ```json
			const cleanJson = text.replace(/```json|```/g, "").trim();

			return JSON.parse(cleanJson);
		} catch (error) {
			// Sesuai spec: Centralized Error Handling buat nanganin rate limit [cite: 187]
			console.error("AI_SERVICE_ERROR:", error);
			throw new Error("Gagal mendapatkan respon terstruktur dari Gemini");
		}
	},
};
