# Design QA — Hennessy Williams Photo

## Visual truth and evidence

- Source visual truth: `reference/selected-option-2.png`
- Browser-rendered implementation: `qa/home-desktop-final.png`
- Mobile reference capture: `qa/home-mobile-final.png`
- Full-view normalized comparison: `qa/concept-vs-implementation-final.png` (source left, implementation right)
- Source pixels: 724 × 2172. The generated concept represents a 1440px desktop artboard and was normalized to 1440 × 4320 for comparison.
- Implementation pixels: 1440 × 4220 at a 1440 × 1100 CSS viewport, `deviceScaleFactor: 1`.
- Mobile implementation pixels: 390 × 5644 at a 390 × 844 CSS viewport, `deviceScaleFactor: 1`.
- State: default home page, top-to-bottom, all native lazy-loaded photography resolved before capture.

## Full-view comparison

The implementation preserves the selected concept's primary design system and composition: black/ivory/oxblood palette, condensed editorial display typography, serif italic accents, split graduate hero, three-image work band, alternating portrait/graduation service blocks, monochrome photographer story, and red closing booking panel. Section order, tonal rhythm, image-led hierarchy, and call-to-action placement align with the source. Copy and crops were adapted to the supplied project brief and generated concept-photo set without changing the direction.

A separate focused-region comparison was not needed because the normalized full-page composite keeps both pages at the same 1440px width, section boundaries remain visible, and no unresolved P0–P2 mismatch required a crop-level inspection.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: The implementation uses the generated concept-photo set rather than Hennessy's final publication-approved originals. These assets are intentionally temporary and should be swapped without changing layout.
- P3: Exact line breaks and image crops differ slightly from the image-generated concept where the responsive implementation prioritizes readable live copy and real viewport behavior.

## Comparison and fix history

### Pass 1

- Earlier finding, P2 / image evidence: native lazy-loaded images at the end of the home and portfolio pages were not present in the initial automated full-page capture because the test did not dwell at the bottom of the page.
- Fix: updated the Playwright capture routine to scroll through every viewport increment, pause at the page bottom, verify every image's `naturalWidth`, return to the top, and only then capture.
- Post-fix evidence: `qa/home-desktop-final.png`, `qa/portfolio-desktop-final.png`, and `qa/home-mobile-final.png` show all photography loaded.

### Pass 2

- Earlier finding, P2 / accessibility: the portfolio lightbox moved focus to its Close control but did not restore focus to the opening tile.
- Fix: stored the triggering tile and restored focus after Close, backdrop click, or Escape.
- Post-fix evidence: `npm run qa:browser` asserts dialog opening, Escape closing, and focus restoration.

### Pass 3

- Earlier finding, P2 / accessibility: Lighthouse reported one small red text link at 4.22:1 contrast and wordmark links whose explicit accessible names did not contain the visible label.
- Fix: raised the red link token to `#eb4d57`, removed the redundant wordmark `aria-label`, preloaded the AVIF hero, and rebuilt the production bundle.
- Post-fix evidence: `qa/lighthouse-home-production.json` records Performance 94, Accessibility 100, Best Practices 100, and SEO 100.

### Pass 4 — user-directed typography refinement

- Earlier finding, P2 / typography: display headings reached 130px while navigation, labels, and footer copy fell as low as 10px. The page-hero lead selector also unintentionally enlarged the eyebrow label, and unsupported 700/italic styles were synthesized by the browser.
- Fix: introduced a tighter 44–96px display range, raised functional copy to a 12–14px floor, corrected the selector collision, used explicit Oswald 600 weights, loaded the real Cormorant 500 italic face, and reduced excessive tracking. Mobile and desktop touch targets were raised to at least 44px high, and the closed mobile navigation is no longer focusable.
- Post-fix evidence: `qa/type-after-home-1440.png`, `qa/type-after-home-390.png`, `qa/type-after-contact-1440.png`, and `qa/type-after-services-390.png`. The final Playwright suite passed all routes and viewports; `qa/lighthouse-home-typography.json` records Performance 93, Accessibility 100, Best Practices 100, and SEO 100.

## Functional and responsive verification

- Browser suite: five routes at 1440 × 1100, 1024 × 900, and 390 × 844.
- Primary interactions: mobile menu, History API navigation, portfolio category filters, lightbox open/close, Escape handling, focus restoration, inquiry-form validation, simulated success response, Pixieset booking URL, and Pixieset gallery URL.
- Network safety: the inquiry form made no non-GET requests and transmitted no inquiry data.
- Console: checked at every route and viewport; no console errors or failed requests in the final run.
- Layout: no horizontal overflow, broken images, or missing main landmarks at tested widths.
- Automated checks: `npm run build`, `npm run test:sites`, and `npm run qa:browser` passed.

final result: passed
