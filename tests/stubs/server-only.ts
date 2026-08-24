/**
 * `server-only` is injected by Next's bundler, so it doesn't resolve under
 * Vitest. Aliased to this no-op in vitest.config.mts, which keeps the real
 * guard in place for the app build while letting the pure logic be tested.
 */
export {};
