import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

// API URL - defaults to localhost:3001 for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/rpc";

function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

const link = new RPCLink({
  url: API_URL,
  headers: () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api: any = createORPCClient(link);

// Auth helpers
export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
