import { createTRPCRouter } from "../trpc";
import { learningRouter } from "./learning";
import { sidebarRouter } from "./sidebar";
import { validationRouter } from "./validation";

export const appRouter = createTRPCRouter({
  learning: learningRouter,
  sidebar: sidebarRouter,
  validation: validationRouter,
});
export type AppRouter = typeof appRouter;
