import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@gemastik/env/server";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Helper buat nunggu (delay)
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * List model dari yang paling diprioritaskan.
 * Kalau 2.5 Flash tumbang (503), kita pindah ke 1.5 Flash (biasanya lebih stabil saat peak).
 */
const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"] as const;

async function callGeminiWithRetry(
	prompt: string,
	systemInstruction?: string,
	retries = 3,
): Promise<string> {
	let lastError: any;
	let delay = 2000; // Mulai dengan 2 detik

	for (let i = 0; i < retries; i++) {
		// Pilih model: Percobaan pertama pake 2.5, sisanya pake 1.5 sebagai fallback
		const modelName = i === 0 ? MODELS[0] : MODELS[1];

		try {
			const model = genAI.getGenerativeModel({
				model: modelName,
				systemInstruction,
			});

			const result = await model.generateContent(prompt);
			const response = await result.response;
			return response.text().trim();
		} catch (error: any) {
			lastError = error;
			const errorMessage = error.message || "";
			const is503 =
				errorMessage.includes("503") ||
				errorMessage.includes("Service Unavailable") ||
				errorMessage.includes("high demand");

			if (is503 && i < retries - 1) {
				console.warn(
					`[AI_RETRY] Attempt ${i + 1} failed (503). Retrying with ${MODELS[1]} in ${delay}ms...`,
				);
				await sleep(delay);
				delay *= 2; // Naik jadi 4s, lalu 8s
				continue;
			}

			// Jika bukan error 503 atau retry habis, langsung lempar ke catch luar
			break;
		}
	}

	throw lastError;
}

export const aiService = {
	async generateText(prompt: string, systemInstruction?: string) {
		try {
			return await callGeminiWithRetry(prompt, systemInstruction);
		} catch (error) {
			console.error("AI_SERVICE_TEXT_ERROR:", error);
			throw new Error(
				"Gagal mendapatkan respon tutor. Gemini sedang sibuk, coba lagi nanti.",
			);
		}
	},

	async generateStructuredOutput(prompt: string, systemInstruction?: string) {
		try {
			const text = await callGeminiWithRetry(prompt, systemInstruction);

			// Logic buat bersihin markdown backticks
			const cleanJson = text.replace(/```json|```/g, "").trim();

			// Parsing dengan try-catch internal biar kalau AI ngaco nggak langsung crash
			try {
				return JSON.parse(cleanJson);
			} catch (parseError) {
				console.error("AI_JSON_PARSE_ERROR:", text);
				throw new Error("Respon AI tidak valid. Mohon kirim ulang pesan Anda.");
			}
		} catch (error: any) {
			console.error("AI_SERVICE_ERROR:", error.message);

			// Kasih pesan spesifik kalau emang beneran overload setelah 3x coba
			if (
				error.message?.includes("503") ||
				error.message?.includes("high demand")
			) {
				throw new Error(
					"Server AI sedang penuh (High Demand). Silakan tunggu 10 detik.",
				);
			}

			throw new Error("Gagal mendapatkan respon terstruktur dari Gemini");
		}
	},
};
