import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import {
  env,
  hasAuth,
  hasCredentialsAuth,
  hasDatabase,
  oauthProviders,
} from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Auth.js configuration.
 *
 * Email and password through the Credentials provider, which forces the JWT
 * session strategy — Auth.js cannot issue database sessions for credentials.
 * The adapter is still wired up so the `user` row is the single source of
 * truth (and so an OAuth provider can be added later without a migration).
 *
 * Everything degrades rather than throws when the environment isn't
 * configured: `getSession()` returns null, sign-in reports that auth is
 * unavailable, and the public site keeps working — only the editor and the
 * dashboard, which require a session, become unreachable.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      workspace: string;
    } & DefaultSession["user"];
  }
}

/** Timing-safe-ish failure path: always spend the cost of a hash compare. */
const DUMMY_HASH =
  "$2a$12$C6UzMDM.H6dfI/f/IKcEe.eJZ0T6.qq0LhAj6WgVOJ0kzZ.9YzZWO";

/**
 * The config is a factory, not an object: Auth.js calls it per request, which
 * keeps `DrizzleAdapter` (and therefore the connection pool) from being
 * constructed at import time — the production build imports this module while
 * collecting page data, where no database exists yet.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  // The adapter is attached only when there's a database to attach it to.
  // Without one, Auth.js still runs on JWT sessions — OAuth works, nothing is
  // persisted server-side, and the studio keeps its drafts in the browser.
  ...(hasDatabase()
    ? {
        adapter: DrizzleAdapter(getDb(), {
          usersTable: users,
          accountsTable: accounts,
          sessionsTable: sessions,
          verificationTokensTable: verificationTokens,
        }),
      }
    : {}),
  secret: env().AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/signin", newUser: "/signup" },
  trustHost: true,
  providers: [
    // OAuth first, so it's the top of the list on the built-in pages too.
    // `allowDangerousEmailAccountLinking` links a provider to an existing
    // account with the same address: both GitHub and Google verify email
    // ownership before releasing it, and without this a visitor who signed up
    // with a password hits an opaque "account not linked" error the first time
    // they click the GitHub button.
    ...(oauthProviders().github
      ? [
          GitHub({
            clientId: env().AUTH_GITHUB_ID,
            clientSecret: env().AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(oauthProviders().google
      ? [
          Google({
            clientId: env().AUTH_GOOGLE_ID,
            clientSecret: env().AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    // Email + password needs the user table; omitted entirely in database-less
    // deployments so the sign-in page doesn't offer a form that cannot work.
    ...(hasCredentialsAuth()
      ? [
          Credentials({
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(raw) {
              const email = String(raw?.email ?? "")
                .trim()
                .toLowerCase();
              const password = String(raw?.password ?? "");
              if (!email || !password) return null;

              // Brake on credential stuffing. Returning null rather than a distinct
              // error keeps "too many attempts" indistinguishable from "wrong
              // password", so the limit itself leaks nothing about the account.
              const attempt = rateLimit(`login:${email}`, {
                limit: 8,
                windowMs: 15 * 60_000,
              });
              if (!attempt.ok) return null;

              const [record] = await getDb()
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);

              // Compare against a dummy hash for unknown accounts so a missing user
              // and a wrong password take about the same time to answer.
              const hash = record?.passwordHash ?? DUMMY_HASH;
              const ok = await bcrypt.compare(password, hash);
              if (!ok || !record?.passwordHash) return null;

              return {
                id: record.id,
                email: record.email,
                name: record.name,
                image: record.image,
                workspace: record.workspace,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.workspace =
          (user as { workspace?: string }).workspace ?? "personal";
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.workspace =
        typeof token.workspace === "string" ? token.workspace : "personal";
      return session;
    },
  },
}));

/**
 * Session read that never throws. Use this in pages and server actions instead
 * of `auth()` directly — with no `DATABASE_URL`/`AUTH_SECRET` configured it
 * reports "signed out" rather than exploding the render.
 */
export async function getSession() {
  if (!hasAuth()) return null;
  try {
    return await auth();
  } catch {
    return null;
  }
}

/** Session or bust — for server actions that write on a user's behalf. */
export async function requireUser() {
  const session = await getSession();
  const user = session?.user;
  if (!user?.id) throw new Error("Not signed in.");
  return { id: user.id, email: user.email ?? "", workspace: user.workspace };
}
