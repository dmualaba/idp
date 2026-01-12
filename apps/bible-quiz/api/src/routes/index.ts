import { authRouter } from "./auth";
import { quizRouter } from "./quiz";
import { attemptRouter } from "./attempt";

export const router = {
  auth: authRouter,
  quiz: quizRouter,
  attempt: attemptRouter,
};

export type Router = typeof router;
