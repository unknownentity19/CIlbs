import Image from "next/image";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const MARK_SIZES: Record<Size, { className: string; pixels: number }> = {
  sm: { className: "h-7 w-7", pixels: 28 },
  md: { className: "h-9 w-9", pixels: 36 },
  lg: { className: "h-11 w-11", pixels: 44 },
};

const TEXT_SIZES: Record<Size, string> = {
  sm: "text-[14px] tracking-[0.18em]",
  md: "text-[16px] tracking-[0.2em]",
  lg: "text-[18px] tracking-[0.22em]",
};

/**
 * Cilbs logomark.
 *
 * The artwork is a raster master (`brand/logo-master.webp`) rather than a
 * path: it's built from overlapping translucent shapes with gradients, and
 * tracing that to SVG would throw away exactly the blending that makes it look
 * like itself. Every size ships from that one master — see
 * `scripts/generate-brand-assets.mjs`.
 */
export function LogoMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: Size;
}) {
  const { className: sizeClass, pixels } = MARK_SIZES[size];
  return (
    <Image
      src="/logo-512.png"
      width={pixels}
      height={pixels}
      alt=""
      aria-hidden
      priority
      draggable={false}
      className={cn(
        "shrink-0 object-contain select-none [-webkit-user-drag:none]",
        sizeClass,
        className,
      )}
    />
  );
}

/**
 * Full Cilbs lockup — logomark + uppercase wordmark.
 */
export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: Size;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 select-none", className)}
    >
      <LogoMark size={size} />
      <span
        className={cn(
          "font-semibold uppercase text-foreground",
          TEXT_SIZES[size],
        )}
      >
        Cilbs
      </span>
    </span>
  );
}
