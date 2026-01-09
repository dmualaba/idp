import { ORPCError } from "@orpc/server";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  quizzes,
  questions,
  answerOptions,
  quizAttempts,
  userAnswers,
} from "../db/schema";
import {
  StartQuizSchema,
  SubmitQuizSchema,
  GetResultSchema,
} from "../lib/schemas";
import { protectedProcedure } from "./base";

// Start a quiz attempt
export const startQuiz = protectedProcedure
  .input(StartQuizSchema)
  .handler(async ({ input, context }) => {
    // Verify quiz exists and is active
    const quiz = await db.query.quizzes.findFirst({
      where: and(eq(quizzes.id, input.quizId), eq(quizzes.isActive, true)),
      with: {
        questions: {
          columns: { id: true },
        },
      },
    });

    if (!quiz) {
      throw new ORPCError("NOT_FOUND", {
        message: "Quiz not found or not active",
      });
    }

    // Create a new attempt
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: context.user.userId,
        quizId: input.quizId,
        totalQuestions: quiz.questions.length,
      })
      .returning();

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      totalQuestions: quiz.questions.length,
    };
  });

// Submit quiz answers and get results
export const submitQuiz = protectedProcedure
  .input(SubmitQuizSchema)
  .handler(async ({ input, context }) => {
    // Verify attempt exists and belongs to user
    const attempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.id, input.attemptId),
        eq(quizAttempts.userId, context.user.userId),
      ),
    });

    if (!attempt) {
      throw new ORPCError("NOT_FOUND", { message: "Quiz attempt not found" });
    }

    if (attempt.completedAt) {
      throw new ORPCError("BAD_REQUEST", { message: "Quiz already submitted" });
    }

    // Get all questions for this quiz with correct answers
    const quizQuestions = await db.query.questions.findMany({
      where: eq(questions.quizId, attempt.quizId),
      with: {
        answerOptions: true,
      },
    });

    // Create a map of question ID to correct option ID
    const correctAnswersMap = new Map<number, number>();
    for (const question of quizQuestions) {
      const correctOption = question.answerOptions.find((opt) => opt.isCorrect);
      if (correctOption) {
        correctAnswersMap.set(question.id, correctOption.id);
      }
    }

    // Process and save user answers
    let correctCount = 0;
    const userAnswerValues = [];

    for (const answer of input.answers) {
      const correctOptionId = correctAnswersMap.get(answer.questionId);
      const isCorrect = correctOptionId === answer.selectedOptionId;

      if (isCorrect) {
        correctCount++;
      }

      userAnswerValues.push({
        attemptId: input.attemptId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect,
      });
    }

    // Save all user answers
    if (userAnswerValues.length > 0) {
      await db.insert(userAnswers).values(userAnswerValues);
    }

    // Update attempt with score and completion time
    const [updatedAttempt] = await db
      .update(quizAttempts)
      .set({
        score: correctCount,
        completedAt: new Date(),
      })
      .where(eq(quizAttempts.id, input.attemptId))
      .returning();

    // Calculate percentage
    const totalQuestions = quizQuestions.length;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    return {
      attemptId: updatedAttempt.id,
      score: correctCount,
      totalQuestions,
      percentage,
      completedAt: updatedAttempt.completedAt,
    };
  });

// Get quiz result
export const getResult = protectedProcedure
  .input(GetResultSchema)
  .handler(async ({ input, context }) => {
    const attempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.id, input.attemptId),
        eq(quizAttempts.userId, context.user.userId),
      ),
      with: {
        quiz: {
          columns: {
            id: true,
            title: true,
            description: true,
          },
        },
        userAnswers: {
          with: {
            question: {
              columns: {
                id: true,
                questionText: true,
              },
            },
            selectedOption: {
              columns: {
                id: true,
                optionText: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new ORPCError("NOT_FOUND", { message: "Quiz attempt not found" });
    }

    if (!attempt.completedAt) {
      throw new ORPCError("BAD_REQUEST", { message: "Quiz not yet completed" });
    }

    // Get correct answers for questions
    const questionIds = attempt.userAnswers.map((ua) => ua.questionId);
    const questionsWithCorrect = await db.query.questions.findMany({
      where: (questions, { inArray }) => inArray(questions.id, questionIds),
      with: {
        answerOptions: {
          where: eq(answerOptions.isCorrect, true),
        },
      },
    });

    const correctAnswersMap = new Map<
      number,
      { id: number; optionText: string }
    >();
    for (const q of questionsWithCorrect) {
      const correct = q.answerOptions[0];
      if (correct) {
        correctAnswersMap.set(q.id, {
          id: correct.id,
          optionText: correct.optionText,
        });
      }
    }

    const percentage =
      attempt.totalQuestions && attempt.totalQuestions > 0
        ? Math.round((attempt.score! / attempt.totalQuestions) * 100)
        : 0;

    return {
      attemptId: attempt.id,
      quiz: attempt.quiz,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage,
      completedAt: attempt.completedAt,
      answers: attempt.userAnswers.map((ua) => ({
        questionId: ua.question.id,
        questionText: ua.question.questionText,
        selectedOption: {
          id: ua.selectedOption.id,
          text: ua.selectedOption.optionText,
          wasCorrect: ua.selectedOption.isCorrect,
        },
        correctOption: correctAnswersMap.get(ua.questionId),
      })),
    };
  });

// Get user's quiz history
export const getMyAttempts = protectedProcedure.handler(async ({ context }) => {
  const attempts = await db.query.quizAttempts.findMany({
    where: eq(quizAttempts.userId, context.user.userId),
    with: {
      quiz: {
        columns: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: (quizAttempts, { desc }) => [desc(quizAttempts.createdAt)],
  });

  return attempts.map((attempt) => ({
    attemptId: attempt.id,
    quiz: attempt.quiz,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage:
      attempt.totalQuestions && attempt.score !== null
        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
        : null,
    completedAt: attempt.completedAt,
    createdAt: attempt.createdAt,
  }));
});

export const attemptRouter = {
  start: startQuiz,
  submit: submitQuiz,
  result: getResult,
  myAttempts: getMyAttempts,
};
