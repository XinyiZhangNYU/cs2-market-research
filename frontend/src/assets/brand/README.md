# CS2 ROTATE brand assets

The production wordmark uses the selected B concept: the blue/orange observation arcs replace
the `O` in `ROTATE`. The word shapes are fixed SVG outlines rather than live text, so the brand
does not depend on fonts installed on the visitor's operating system.

The Latin outlines were generated from Geist SemiBold, sourced from the official
`vercel/geist-font` repository under the SIL Open Font License 1.1. Source TTF SHA-256:
`B9F52322D6D20A7FF1E7FE1310FF12EC851AEBB83D24F8B4F1D4149298F489B2`.

- `cs2-rotate-wordmark.svg`: color wordmark for light surfaces.
- `cs2-rotate-wordmark-reverse.svg`: color wordmark for dark surfaces.
- `cs2-rotate-wordmark-mono.svg`: one-color wordmark.
- `cs2-rotate-favicon.svg`: optically adjusted small-size mark on the fixed cream tile.

The arcs and the observation point turn on the home surface and rest on every other page. The
motion lives in `src/components/BrandWordmark.tsx`, which inlines this wordmark so the page's
own stylesheet can reach the mark; `<img>` cannot be styled from outside. Keep that component's
outlines in step with this file. The footer still renders this asset directly and stays static.
The mark uses the same 22-second rotation period as the home catalog snapshot-time orbit;
`prefers-reduced-motion: reduce` stops both rotations.

This supersedes the first production release's rule that the mark must never animate.
