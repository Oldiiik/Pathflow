import { supabaseAdmin } from "../db/supabase.js";
import { badRequest } from "../lib/httpError.js";
import type { Profile } from "../domain/profileSchemas.js";

interface ProfileRow {
  id: string;
  display_name: string;
  field: string;
  region: string;
  avoid: string;
  created_at?: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    name: row.display_name ?? "",
    field: row.field ?? "",
    region: row.region ?? "",
    avoid: row.avoid ?? "",
    createdAt: row.created_at,
  };
}

export async function createAuthUserWithProfile(input: {
  email: string;
  password: string;
  name: string;
  field: string;
  region: string;
  avoid: string;
}): Promise<{ userId: string }> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    user_metadata: { name: input.name },
    email_confirm: true,
  });

  if (error || !data.user) {
    throw badRequest(error?.message ?? "Failed to create user.", "signup_failed");
  }

  await upsertProfile(data.user.id, {
    name: input.name,
    field: input.field,
    region: input.region,
    avoid: input.avoid,
  });

  return { userId: data.user.id };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const result = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, field, region, avoid, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (result.error) throw badRequest(result.error.message, "profile_load_failed");
  return result.data ? toProfile(result.data) : null;
}

export async function upsertProfile(
  userId: string,
  input: Partial<Pick<Profile, "name" | "field" | "region" | "avoid">>,
): Promise<Profile> {
  const existing = await getProfile(userId);
  const payload = {
    id: userId,
    display_name: input.name ?? existing?.name ?? "",
    field: input.field ?? existing?.field ?? "",
    region: input.region ?? existing?.region ?? "",
    avoid: input.avoid ?? existing?.avoid ?? "",
  };

  const result = await supabaseAdmin
    .from("profiles")
    .upsert(payload)
    .select("id, display_name, field, region, avoid, created_at")
    .single<ProfileRow>();

  if (result.error) throw badRequest(result.error.message, "profile_save_failed");
  return toProfile(result.data);
}
