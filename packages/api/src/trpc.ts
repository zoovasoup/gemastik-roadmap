import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@gemastik/db";
import { type Context } from "./context"; // Asumsi lo punya context creator buat session

const t = initTRPC.context<Context>().create();

/**
 * Middleware buat nge-cek autentikasi (Defense in Depth Layer 1)
 * Mastiin session user valid sebelum lanjut ke business logic.
 */
const isAuthed = t.middleware(({ next, ctx }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Lo harus login dulu buat akses fitur ini.",
		});
	}
	return next({
		ctx: {
			db,
			user: ctx.session.user,
		},
	});
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
