import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests cover the pure logic the studio depends on — graph ordering,
 * branch evaluation, validation, layout, history, and draft parsing. Those are
 * the parts where a regression is silent; the React surface is verified in the
 * browser instead.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/stubs/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Injected by Next's bundler at build time; stubbed here so modules
      // carrying the server-only guard can still be unit tested.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
});
