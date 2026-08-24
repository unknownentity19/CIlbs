/**
 * The inline `<script>` bodies in the root layout, kept here as constants so
 * the CSP can allow them by hash.
 *
 * Why hashes rather than a nonce: the root layout is shared with the static
 * marketing pages, and reading the per-request nonce there (via `headers()`)
 * would opt the entire site into dynamic rendering. These snippets are fixed
 * strings, so a hash allows them under the strict policy without giving up
 * static generation anywhere.
 *
 * `inline-scripts.test.ts` recomputes the digests from these strings, so
 * editing a snippet without updating its hash fails the build rather than
 * silently getting blocked in the browser.
 */

/** Flags real touch hardware before first paint. */
export const GFX_LITE_SCRIPT =
  "try{if(navigator.maxTouchPoints>0||matchMedia('(any-pointer:coarse)').matches){document.documentElement.classList.add('gfx-lite')}}catch(e){}";

/** Applies the saved theme before first paint. */
export const THEME_SCRIPT =
  "try{var t=localStorage.getItem('cilbs-theme')||localStorage.getItem('hypero-theme');if(t==='dark'||t==='light'){document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t}}catch(e){}";

/** CSP `script-src` sources for the two snippets above. */
export const INLINE_SCRIPT_HASHES: readonly string[] = [
  "'sha256-YfoKNLl1DcMqSAYzZgo1FAsIZKM00CY6tcs/lw0P6Zk='",
  "'sha256-7QMk006GZPnN8T4ye9vwrKWfObpUwGNSwQGxNgjAcQg='",
];
