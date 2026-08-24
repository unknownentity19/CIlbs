/**
 * The inline `<script>` body in the root layout, kept here as a constant so
 * the CSP can allow it by hash.
 *
 * Why hashes rather than a nonce: the root layout is shared with the static
 * marketing pages, and reading the per-request nonce there (via `headers()`)
 * would opt the entire site into dynamic rendering. It is a fixed string, so
 * a hash allows it under the strict policy without giving up static
 * generation anywhere.
 *
 * `inline-scripts.test.ts` recomputes the digest from the string, so editing
 * the snippet without updating its hash fails the build rather than silently
 * getting blocked in the browser.
 */

/** Flags real touch hardware before first paint. */
export const GFX_LITE_SCRIPT =
  "try{if(navigator.maxTouchPoints>0||matchMedia('(any-pointer:coarse)').matches){document.documentElement.classList.add('gfx-lite')}}catch(e){}";

/** CSP `script-src` source for the snippet above. */
export const INLINE_SCRIPT_HASHES: readonly string[] = [
  "'sha256-YfoKNLl1DcMqSAYzZgo1FAsIZKM00CY6tcs/lw0P6Zk='",
];
