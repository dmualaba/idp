import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .references(() => quizzes.id, { onDelete: "cascade" })
    .notNull(),
  questionText: text("question_text").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Answer options table
export const answerOptions = pgTable("answer_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  quizId: integer("quiz_id")
    .references(() => quizzes.id)
    .notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User answers table
export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id")
    .references(() => quizAttempts.id, { onDelete: "cascade" })
    .notNull(),
  questionId: integer("question_id")
    .references(() => questions.id)
    .notNull(),
  selectedOptionId: integer("selected_option_id")
    .references(() => answerOptions.id)
    .notNull(),
  isCorrect: boolean("is_correct").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [quizzes.createdBy],
    references: [users.id],
  }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  answerOptions: many(answerOptions),
  userAnswers: many(userAnswers),
}));

export const answerOptionsRelations = relations(answerOptions, ({ one }) => ({
  question: one(questions, {
    fields: [answerOptions.questionId],
    references: [questions.id],
  }),
}));

export const quizAttemptsRelations = relations(
  quizAttempts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [quizAttempts.userId],
      references: [users.id],
    }),
    quiz: one(quizzes, {
      fields: [quizAttempts.quizId],
      references: [quizzes.id],
    }),
    userAnswers: many(userAnswers),
  }),
);

export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [userAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(questions, {
    fields: [userAnswers.questionId],
    references: [questions.id],
  }),
  selectedOption: one(answerOptions, {
    fields: [userAnswers.selectedOptionId],
    references: [answerOptions.id],
  }),
}));
