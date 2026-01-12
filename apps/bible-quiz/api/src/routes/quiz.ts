import { ORPCError } from "@orpc/server";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { quizzes, questions, answerOptions } from "../db/schema";
import {
  CreateQuizSchema,
  UpdateQuizSchema,
  CreateQuestionSchema,
  GetQuizSchema,
  DeleteQuizSchema,
  DeleteQuestionSchema,
} from "../lib/schemas";
import { publicProcedure, adminProcedure } from "./base";

// List all quizzes (public)
export const listQuizzes = publicProcedure.handler(async () => {
  const allQuizzes = await db.query.quizzes.findMany({
    where: eq(quizzes.isActive, true),
    columns: {
      id: true,
      title: true,
      description: true,
      isActive: true,
      createdAt: true,
    },
    with: {
      createdByUser: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: (quizzes, { desc }) => [desc(quizzes.createdAt)],
  });

  return allQuizzes;
});

// Get quiz by ID with questions (public - for taking quiz)
export const getQuiz = publicProcedure
  .input(GetQuizSchema)
  .handler(async ({ input }) => {
    const quiz = await db.query.quizzes.findFirst({
      where: and(eq(quizzes.id, input.quizId), eq(quizzes.isActive, true)),
      columns: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
      with: {
        questions: {
          columns: {
            id: true,
            questionText: true,
            orderIndex: true,
          },
          orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
          with: {
            answerOptions: {
              columns: {
                id: true,
                optionText: true,
                orderIndex: true,
                // Note: isCorrect is NOT included for security
              },
              orderBy: (answerOptions, { asc }) => [
                asc(answerOptions.orderIndex),
              ],
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new ORPCError("NOT_FOUND", { message: "Quiz not found" });
    }

    return quiz;
  });

// Admin: Create a new quiz
export const createQuiz = adminProcedure
  .input(CreateQuizSchema)
  .handler(async ({ input, context }) => {
    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        title: input.title,
        description: input.description,
        createdBy: context.user.userId,
      })
      .returning();

    return newQuiz;
  });

// Admin: Update a quiz
export const updateQuiz = adminProcedure
  .input(UpdateQuizSchema)
  .handler(async ({ input }) => {
    const [updated] = await db
      .update(quizzes)
      .set({
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, input.quizId))
      .returning();

    if (!updated) {
      throw new ORPCError("NOT_FOUND", { message: "Quiz not found" });
    }

    return updated;
  });

// Admin: Delete a quiz
export const deleteQuiz = adminProcedure
  .input(DeleteQuizSchema)
  .handler(async ({ input }) => {
    const [deleted] = await db
      .delete(quizzes)
      .where(eq(quizzes.id, input.quizId))
      .returning();

    if (!deleted) {
      throw new ORPCError("NOT_FOUND", { message: "Quiz not found" });
    }

    return { message: "Quiz deleted successfully" };
  });

// Admin: Add a question to a quiz
export const createQuestion = adminProcedure
  .input(CreateQuestionSchema)
  .handler(async ({ input }) => {
    // Verify quiz exists
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, input.quizId),
    });

    if (!quiz) {
      throw new ORPCError("NOT_FOUND", { message: "Quiz not found" });
    }

    // Validate that exactly one option is correct
    const correctOptions = input.options.filter((opt) => opt.isCorrect);
    if (correctOptions.length !== 1) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Exactly one option must be marked as correct",
      });
    }

    // Create question
    const [newQuestion] = await db
      .insert(questions)
      .values({
        quizId: input.quizId,
        questionText: input.questionText,
        orderIndex: input.orderIndex ?? 0,
      })
      .returning();

    // Create answer options
    const optionValues = input.options.map((opt, index) => ({
      questionId: newQuestion.id,
      optionText: opt.optionText,
      isCorrect: opt.isCorrect,
      orderIndex: index,
    }));

    await db.insert(answerOptions).values(optionValues);

    // Fetch the complete question with options
    const completeQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, newQuestion.id),
      with: {
        answerOptions: {
          orderBy: (answerOptions, { asc }) => [asc(answerOptions.orderIndex)],
        },
      },
    });

    return completeQuestion;
  });

// Admin: Delete a question
export const deleteQuestion = adminProcedure
  .input(DeleteQuestionSchema)
  .handler(async ({ input }) => {
    const [deleted] = await db
      .delete(questions)
      .where(eq(questions.id, input.questionId))
      .returning();

    if (!deleted) {
      throw new ORPCError("NOT_FOUND", { message: "Question not found" });
    }

    return { message: "Question deleted successfully" };
  });

// Admin: Get quiz with all details including correct answers
export const getQuizAdmin = adminProcedure
  .input(GetQuizSchema)
  .handler(async ({ input }) => {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, input.quizId),
      with: {
        questions: {
          orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
          with: {
            answerOptions: {
              orderBy: (answerOptions, { asc }) => [
                asc(answerOptions.orderIndex),
              ],
            },
          },
        },
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new ORPCError("NOT_FOUND", { message: "Quiz not found" });
    }

    return quiz;
  });

// Admin: List all quizzes (including inactive)
export const listQuizzesAdmin = adminProcedure.handler(async () => {
  const allQuizzes = await db.query.quizzes.findMany({
    with: {
      createdByUser: {
        columns: {
          id: true,
          name: true,
        },
      },
      questions: {
        columns: {
          id: true,
        },
      },
    },
    orderBy: (quizzes, { desc }) => [desc(quizzes.createdAt)],
  });

  return allQuizzes.map((quiz) => ({
    ...quiz,
    questionCount: quiz.questions.length,
    questions: undefined,
  }));
});

export const quizRouter = {
  list: listQuizzes,
  get: getQuiz,
  create: createQuiz,
  update: updateQuiz,
  delete: deleteQuiz,
  createQuestion,
  deleteQuestion,
  admin: {
    list: listQuizzesAdmin,
    get: getQuizAdmin,
  },
};
