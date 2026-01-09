import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";
import { RegisterSchema, LoginSchema } from "../lib/schemas";
import { publicProcedure, protectedProcedure } from "./base";

// Register a new user
export const register = publicProcedure
  .input(RegisterSchema)
  .handler(async ({ input }) => {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      throw new ORPCError("CONFLICT", {
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: "user",
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    // Generate token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: newUser,
      token,
    };
  });

// Login user
export const login = publicProcedure
  .input(LoginSchema)
  .handler(async ({ input }) => {
    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (!user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password);

    if (!isValidPassword) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  });

// Get current user (requires authentication)
export const me = protectedProcedure.handler(async ({ context }) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, context.user.userId),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ORPCError("NOT_FOUND", { message: "User not found" });
  }

  return user;
});

// Logout - client-side token removal, but we can provide an endpoint for consistency
export const logout = protectedProcedure.handler(async () => {
  // In a stateless JWT setup, logout is handled client-side
  // This endpoint is provided for API consistency
  return { message: "Logged out successfully" };
});

export const authRouter = {
  register,
  login,
  me,
  logout,
};
