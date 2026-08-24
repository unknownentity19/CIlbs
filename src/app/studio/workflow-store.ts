import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workflows } from "@/db/schema";

/**
 * Shared persistence for saved workflows.
 *
 * Lives outside `actions.ts` because that file is `"use server"`, where every
 * export has to be an async server action — schemas and helpers can't live
 * there. Both the server action and the beacon route handler (which the page
 * uses on unload, where a server action cannot be called) go through this, so
 * the validation and the write are identical whichever path a save arrives on.
 */

const nodeSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.string().min(1).max(32),
  label: z.string().max(200),
  x: z.number().finite(),
  y: z.number().finite(),
  config: z.record(z.string(), z.unknown()),
});

const edgeSchema = z.object({
  id: z.string().min(1).max(64),
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  branch: z.enum(["true", "false"]).optional(),
});

/** Caps bound a row's size on a free-tier database and reject hostile input. */
export const workflowSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(120),
  nodes: z.array(nodeSchema).max(200),
  edges: z.array(edgeSchema).max(400),
});

export type StoredWorkflow = z.infer<typeof workflowSchema>;

/** Upsert one graph for one owner. Idempotent: it runs on every autosave. */
export async function persistWorkflow(userId: string, data: StoredWorkflow) {
  const { id, name, nodes, edges } = data;
  const now = new Date();
  await getDb()
    .insert(workflows)
    .values({ id, userId, name, graph: { nodes, edges }, updatedAt: now })
    .onConflictDoUpdate({
      target: workflows.id,
      // Scoped to the owner so a guessed id can't overwrite someone else's row.
      setWhere: eq(workflows.userId, userId),
      set: { name, graph: { nodes, edges }, updatedAt: now },
    });
  return now;
}

/** The owner's most recently touched graph, or null when there isn't one. */
export async function readLatestWorkflow(
  userId: string,
): Promise<StoredWorkflow | null> {
  const [row] = await getDb()
    .select()
    .from(workflows)
    .where(eq(workflows.userId, userId))
    .orderBy(desc(workflows.updatedAt))
    .limit(1);
  if (!row) return null;
  const parsed = workflowSchema.safeParse({
    id: row.id,
    name: row.name,
    ...(row.graph as object),
  });
  return parsed.success ? parsed.data : null;
}

export async function removeWorkflow(userId: string, id: string) {
  await getDb()
    .delete(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
}
