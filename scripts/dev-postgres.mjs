import { mkdirSync, rmSync } from "node:fs";

/**
 * `embedded-postgres` is not a dependency of this project on purpose: it pulls
 * ~144MB of Postgres binaries, which every Vercel build and CI run would then
 * download for a tool only ever used on a developer machine. Install it when
 * you want a local database.
 */
let EmbeddedPostgres;
try {
  ({ default: EmbeddedPostgres } = await import("embedded-postgres"));
} catch {
  console.error(
    "This script needs a one-off dev dependency:\n\n" +
      "  npm i --no-save embedded-postgres\n\n" +
      "It downloads real Postgres binaries into node_modules and is deliberately\n" +
      "not in package.json — see the comment at the top of this file.\n",
  );
  process.exit(1);
}

/**
 * A throwaway Postgres for local work and for the auth integration test.
 *
 * Downloads the official binaries on first run and keeps its data under
 * .postgres/ (gitignored). This exists so the account flow — sign up, sign in,
 * workflows syncing to a row — can be exercised for real without signing up
 * for a hosted database first.
 *
 *   node scripts/dev-postgres.mjs start   # boots on 55432 and stays up
 *   node scripts/dev-postgres.mjs stop
 *   node scripts/dev-postgres.mjs reset   # throw the cluster away and re-init
 *
 * Connection string:
 *   postgresql://cilbs:cilbs@127.0.0.1:55432/cilbs
 */

const DATA_DIR = ".postgres";
const PORT = 55432;

mkdirSync(DATA_DIR, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "cilbs",
  password: "cilbs",
  port: PORT,
  persistent: true,
});

const command = process.argv[2] ?? "start";

if (command === "reset") {
  try {
    await pg.stop();
  } catch {
    // Not running.
  }
  rmSync(DATA_DIR, { recursive: true, force: true });
  console.log(`removed ${DATA_DIR} — run 'start' to create a fresh cluster`);
  process.exit(0);
}

if (command === "start") {
  try {
    await pg.initialise();
  } catch {
    // Already initialised from a previous run. If that cluster was created
    // with different credentials — which is exactly what happens when the
    // project is renamed — starting succeeds but every connection is refused,
    // so the error is checked for explicitly below rather than left to
    // surface as a baffling "password authentication failed".
  }
  await pg.start();
  try {
    await pg.createDatabase("cilbs");
  } catch {
    // Already there.
  }

  // Prove the advertised credentials actually work before claiming readiness.
  const { Client } = await import("pg");
  const probe = new Client({
    connectionString: `postgresql://cilbs:cilbs@127.0.0.1:${PORT}/cilbs`,
  });
  try {
    await probe.connect();
    await probe.end();
  } catch (error) {
    console.error(
      `\nThis cluster won't accept the expected credentials:\n  ${error.message}\n\n` +
        `That usually means ${DATA_DIR} was created with a different user — ` +
        `it is a throwaway, so:\n  node scripts/dev-postgres.mjs reset\n`,
    );
    await pg.stop();
    process.exit(1);
  }
  console.log(
    `postgres ready → postgresql://cilbs:cilbs@127.0.0.1:${PORT}/cilbs`,
  );
  // Keep the process alive; the caller stops it.
  process.stdin.resume();
} else if (command === "stop") {
  await pg.stop();
  console.log("postgres stopped");
}
