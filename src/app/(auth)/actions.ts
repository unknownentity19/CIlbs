"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { headers } from "next/headers";
import { hasAuth } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Account creation.
 *
 * Runs on the server so the password never reaches the client bundle and the
 * hash never leaves this process. Returns a plain result object instead of
 * throwing, because the sign-up form renders the message inline.
 */

const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(1, "Enter your name.").max(120),
});

export type SignUpResult = { ok: true } | { ok: false; error: string };

/** bcrypt cost. 12 is ~250ms on a small serverless instance — slow enough to
 * matter for an attacker, fast enough that a login doesn't feel broken. */
const COST = 12;

export async function createAccount(input: unknown): Promise<SignUpResult> {
  if (!hasAuth()) {
    return {
      ok: false,
      error:
        "Accounts aren't available yet — DATABASE_URL and AUTH_SECRET are not configured on this deployment.",
    };
  }

  // Account creation is the one unauthenticated write, so it gets a cap.
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const attempt = rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!attempt.ok) {
    return {
      ok: false,
      error: "Too many sign-up attempts. Try again in a little while.",
    };
  }

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const { email, password, name } = parsed.data;

  try {
    const [existing] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return { ok: false, error: "An account with that email already exists." };
    }

    await getDb().insert(users).values({
      email,
      name,
      passwordHash: await bcrypt.hash(password, COST),
      // Derived rather than asked for. Sign-up is three fields, and naming a
      // workspace is not a decision worth making before you've seen the
      // product — it's a label in the account menu, not something that has to
      // be right up front.
      workspace: (name.split(" ")[0] || "personal").toLowerCase(),
    });
    return { ok: true };
  } catch (error) {
    // A unique-violation here means two requests raced; treat it as taken.
    if (
      error instanceof Error &&
      /duplicate key|unique constraint/i.test(error.message)
    ) {
      return { ok: false, error: "An account with that email already exists." };
    }
    console.error("createAccount failed", error);
    return { ok: false, error: "Something went wrong creating the account." };
  }
}
