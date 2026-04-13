import { roadmapService } from "./src/services/roadmap.service";

// Test script untuk AI Service - Fokus ke roadmapService.generateInitialRoadmap()..
// Nanti ini file hapus aja kalo udah pindah ke API

const testGoal = "Belajar deploy Next.js ke VPS pake Docker dan Nginx";

console.log("🚀 Testing Gradio Engine: Micro-Curriculum Synthesis...");

const result = await roadmapService.generateInitialRoadmap(testGoal);

console.log("✅ AI Response (Parsed JSON):");
console.log(JSON.stringify(result, null, 2));

// Logic Check: Pastikan field yang kita butuhin ada semua [cite: 116-124]
if (result.nodes && Array.isArray(result.nodes)) {
	console.log(`\n🎉 Berhasil generate ${result.nodes.length} nodes!`);
} else {
	console.error("\n❌ Output format mismatch. Cek system instruction.");
}
