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

// Authenticated procedure builder
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
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
  }
);

// Admin procedure builder - includes auth + admin role check
export const adminProcedure = publicProcedure.use(async ({ context, next }) => {
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

  if (user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }

  return next({
    context: { ...context, user } as AdminContext,
  });
});
