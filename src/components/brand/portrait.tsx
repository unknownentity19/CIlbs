/**
 * An illustrated portrait for the testimonial avatar.
 *
 * Deliberately an illustration rather than a photograph. The quote beside it
 * is written copy, not something a customer said, and attaching a real
 * person's face to it would present an actual human as endorsing the product.
 * Stock licences forbid that too: Unsplash, Pexels and Getty all bar using an
 * identifiable person in a way that implies endorsement.
 *
 * Drawn as inline SVG rather than an image file so it costs no request, needs
 * no `img-src` allowance in the content-security policy, and stays sharp at
 * any size.
 *
 * Built from ellipses and arcs rather than hand-authored cubic paths, so the
 * proportions stay predictable. The one trick worth knowing: the hair is a
 * plain ellipse *clipped to the head*, which is what keeps a fringe from
 * floating above the skull like a hat, and lets the sideburns hug the face
 * edge instead of hanging beside it as loose bars.
 *
 * Feature positions follow the usual head canon — hairline about a third
 * down, eyes on the midline, mouth between nose and chin.
 */

export function Portrait({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Illustrated portrait"
    >
      <defs>
        <clipPath id="portrait-frame">
          <circle cx="32" cy="32" r="32" />
        </clipPath>
        {/* The skull. Everything hair-shaped is clipped to it. */}
        <clipPath id="portrait-head">
          <ellipse cx="32" cy="26" rx="12.6" ry="14.4" />
        </clipPath>
      </defs>

      <g clipPath="url(#portrait-frame)">
        <rect width="64" height="64" fill="#EAECF2" />

        {/* A slightly larger ellipse behind the head, so the hair has some
            volume at the crown rather than being painted flat onto it. */}
        <ellipse cx="32" cy="24.2" rx="13.5" ry="15.2" fill="#2A2119" />

        {/* Neck, tucked under the jaw and behind the shoulders below. */}
        <rect x="27.1" y="31" width="9.8" height="15" rx="4.9" fill="#D2A17C" />

        {/* Face */}
        <ellipse cx="32" cy="26" rx="12.6" ry="14.4" fill="#E9BB95" />
        <ellipse cx="19.7" cy="27.4" rx="2" ry="2.8" fill="#DEAE86" />
        <ellipse cx="44.3" cy="27.4" rx="2" ry="2.8" fill="#DEAE86" />

        <g clipPath="url(#portrait-head)">
          {/* Fringe. Offset right so the parting isn't dead centre. */}
          <ellipse cx="33" cy="14" rx="13.6" ry="8.2" fill="#2A2119" />
          {/* Sideburns — clipped, so they follow the jawline. */}
          <rect x="18" y="18" width="4.2" height="11" fill="#2A2119" />
          <rect x="41.8" y="18" width="4.2" height="9" fill="#2A2119" />
        </g>

        {/* Brows */}
        <path
          d="M25.9 22.9a6 6 0 0 1 5 .4"
          stroke="#3A2B1F"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M38.1 22.9a6 6 0 0 0-5 .4"
          stroke="#3A2B1F"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyes */}
        <ellipse cx="27.6" cy="26.2" rx="1.5" ry="1.8" fill="#2F251C" />
        <ellipse cx="36.4" cy="26.2" rx="1.5" ry="1.8" fill="#2F251C" />

        {/* Nose: the base only. A full outline turns to mud at 36px, and a
            straight stem reads as a letter rather than a nose. */}
        <path
          d="M30.6 31.5a2.4 2.4 0 0 0 2.8 0"
          stroke="#CF9B74"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Mouth */}
        <path
          d="M29.5 35a4.6 4.6 0 0 0 5 0"
          stroke="#A9694A"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Shoulders last, so they overlap the base of the neck. Wide enough
            to reach past the circle on both sides — a gap at the bottom
            corners is what gives away a floating bust. */}
        <ellipse cx="32" cy="76" rx="38" ry="33" fill="#2E3340" />
        <path
          d="M23.5 48a10 10 0 0 0 17 0"
          stroke="#464C5C"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
