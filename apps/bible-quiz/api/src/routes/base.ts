import { os, ORPCError } from "@orpc/server";
import type { IncomingHttpHeaders } from "node:http";
import { parseAuthHeader, verifyToken, type JwtPayload } from "../lib/auth";

// Base context type with headers
export interface BaseContext {
  headers: IncomingHttpHeaders;
}

// Authenticated context with user
export interface AuthenticatedContext extends BaseContext {
  user: JwtPayload;
}

// Admin context
export interface AdminContext extends AuthenticatedContext {
  user: JwtPayload & { role: "admin" };
}

// Public procedure builder
export const publicProcedure = os.$context<BaseContext>();

// Auth middleware - validates JWT and adds user to context
export const authMiddleware = os
  .$context<BaseContext>()
  .middleware(async ({ context, next }) => {
    const token = parseAuthHeader(context.headers.authorization);

    if (!token) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Missing authentication token",
      });
    }

    const user = verifyToken(token);

    if (!user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Invalid or expired token",
      });
    }

    return next({
      context: { ...context, user },
    });
  });

// Authenticated procedure builder
export const protectedProcedure = authMiddleware;

// Admin middleware - requires admin role
export const adminMiddleware = authMiddleware.middleware(
  async ({ context, next }) => {
    if (context.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
    }

    return next({
      context: context as AdminContext,
    });
  },
);

// Admin procedure builder
export const adminProcedure = adminMiddleware;
