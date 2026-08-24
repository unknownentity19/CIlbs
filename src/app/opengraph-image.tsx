import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";
import { MARK_DATA_URI } from "@/components/brand/mark-data";

// No `runtime = "edge"`: Next 16 deprecates the edge runtime, and running on
// Node lets this card be generated at build time instead of on every request.

export const alt = `${SITE.name} — ${SITE.shortDescription}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(circle at 80% 0%, rgba(139,92,246,0.18), transparent 50%), radial-gradient(circle at 0% 100%, rgba(99,102,241,0.18), transparent 55%), #ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#09090b",
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Satori can't fetch a file, so the mark is inlined as a data URI
              by scripts/generate-brand-assets.mjs. */}
          <img src={MARK_DATA_URI} width={64} height={64} alt="" />
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {SITE.name}
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 86,
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              maxWidth: 980,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Build AI workflows</span>
            <span
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              visually.
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#52525B",
              maxWidth: 880,
              lineHeight: 1.4,
            }}
          >
            {SITE.description}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#71717A",
          }}
        >
          <span>cilbs.com</span>
          <span style={{ display: "flex", gap: 16 }}>
            <span>Visual canvas</span>
            <span>·</span>
            <span>AI agents</span>
            <span>·</span>
            <span>Production runtime</span>
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
