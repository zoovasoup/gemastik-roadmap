import { createTRPCRouter } from "../trpc";
import { learningRouter } from "./learning";
import { validationRouter } from "./validation";

export const appRouter = createTRPCRouter({
  learning: learningRouter,
  validation: validationRouter,
});
export type AppRouter = typeof appRouter;
