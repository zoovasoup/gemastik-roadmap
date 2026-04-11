import { defineConfig } from "drizzle-kit";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const toPosixPath = (value: string) => value.replace(/\\/g, "/");
const toWorkspaceRelative = (absPath: string) =>
	toPosixPath(relative(process.cwd(), absPath));

// 1. Pastikan path ke .env di root monorepo sudah benar secara absolut
config({ path: join(__dirname, "../../.env") });

// Debugging: Langsung liat apakah env-nya bocor ke proses
if (!process.env.DATABASE_URL) {
	console.warn(
		"⚠️ [Drizzle Config] DATABASE_URL is missing! Check your .env file at root.",
	);
}

export default defineConfig({
	// 2. Gunakan absolute path buat schema dan out biar nggak peduli lo jalanin dari mana
	schema: toWorkspaceRelative(join(__dirname, "src/schema/*.ts")),
	out: toWorkspaceRelative(join(__dirname, "src/migrations")),
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
	verbose: true,
	strict: true,
});
