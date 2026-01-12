import { z } from "zod";

// Auth schemas
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Quiz schemas
export const CreateQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const UpdateQuizSchema = z.object({
  quizId: z.number().int().positive(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Question schemas
export const AnswerOptionSchema = z.object({
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

export const CreateQuestionSchema = z.object({
  quizId: z.number().int().positive(),
  questionText: z.string().min(1, "Question text is required"),
  options: z.array(AnswerOptionSchema).min(2, "At least 2 options required"),
  orderIndex: z.number().int().optional(),
});

// Quiz attempt schemas
export const StartQuizSchema = z.object({
  quizId: z.number().int().positive(),
});

export const SubmitAnswerSchema = z.object({
  attemptId: z.number().int().positive(),
  questionId: z.number().int().positive(),
  selectedOptionId: z.number().int().positive(),
});

export const SubmitQuizSchema = z.object({
  attemptId: z.number().int().positive(),
  answers: z.array(
    z.object({
      questionId: z.number().int().positive(),
      selectedOptionId: z.number().int().positive(),
    }),
  ),
});

export const GetResultSchema = z.object({
  attemptId: z.number().int().positive(),
});

export const GetQuizSchema = z.object({
  quizId: z.number().int().positive(),
});

export const GetQuestionSchema = z.object({
  questionId: z.number().int().positive(),
});

export const DeleteQuizSchema = z.object({
  quizId: z.number().int().positive(),
});

export const DeleteQuestionSchema = z.object({
  questionId: z.number().int().positive(),
});
