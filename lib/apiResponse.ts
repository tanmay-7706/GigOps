// lib/apiResponse.ts
// Standard API envelope used by every route: { success, data, error }.

import type { ApiResponse } from "@/types";

export function ok<T>(data: T): Response {
  const body: ApiResponse<T> = { success: true, data, error: null };
  return Response.json(body);
}

export function fail(error: string, status = 500): Response {
  const body: ApiResponse<null> = { success: false, data: null, error };
  return Response.json(body, { status });
}
