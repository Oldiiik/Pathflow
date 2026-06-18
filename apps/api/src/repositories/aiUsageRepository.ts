import { env } from "../config/env.js";
import { supabaseAdmin } from "../db/supabase.js";
import { HttpError, badRequest } from "../lib/httpError.js";

interface UsageReservationRow {
  allowed: boolean;
  request_count: number;
}

const testUsage = new Map<string, number>();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function reserveAiUsage(userId: string): Promise<void> {
  if (env.NODE_ENV === "test") {
    const key = `${userId}:${todayKey()}`;
    const count = testUsage.get(key) ?? 0;
    if (count >= env.AI_DAILY_REQUEST_LIMIT) {
      throw new HttpError(429, "ai_daily_limit_exceeded", "Daily AI request limit exceeded.");
    }
    testUsage.set(key, count + 1);
    return;
  }

  const reservation = await supabaseAdmin.rpc("reserve_ai_usage_daily", {
    p_user_id: userId,
    p_usage_date: todayKey(),
    p_limit: env.AI_DAILY_REQUEST_LIMIT,
  });

  if (reservation.error) throw badRequest(reservation.error.message, "ai_usage_reserve_failed");

  const row = (Array.isArray(reservation.data) ? reservation.data[0] : reservation.data) as
    | UsageReservationRow
    | undefined;

  if (!row?.allowed) {
    throw new HttpError(429, "ai_daily_limit_exceeded", "Daily AI request limit exceeded.");
  }
}

export function resetTestAiUsage() {
  testUsage.clear();
}
