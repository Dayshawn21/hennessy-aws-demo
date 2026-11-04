# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Locked product and design decisions

- Visual direction (chosen Oct 17, 2026, replacing the earlier black/ivory/oxblood concept): The Portrait Atelier. Bright atelier-white walls, pattern paper, hang tags for prices, a black appointment card for booking, chalk-blue annotations only. No dark sections. Contract: `../.impeccable/surfaces/site-src-app-jsx.md`; product truth: `../PRODUCT.md`.
- Prioritize portrait and graduation bookings across Stockton and Sacramento; graduation copy serves both graduates and paying parents.
- Public routes are Home, Sessions, Business, Work, About, and Contact. Graduation lives in the first section of Sessions (`/sessions#graduation`); the graduate/parent switch was removed at the user's request (Oct 17, 2026), and the contact form still asks who is booking; the graduation FAQ was removed at the user's request (Oct 17, 2026). Business holds product, real estate and studio rental. `/portfolio`, `/services`, `/studio` and `/graduation` redirect to `/work`, `/sessions`, `/business` and `/sessions#graduation`.
- Never invent reviews, campuses, turnaround, or deposit terms; leave the marked empty slots in `src/content.js` until Hennessy supplies them.
- Pixieset remains the external booking and client-gallery system.
- Photos in `public/assets/photos/work/` are Hennessy’s own work, downloaded from hennessywilliamsphoto.com (Oct 17, 2026). Only `studio-room` is still a low-res screenshot crop; there is no headshot of Hennessy yet.
- The studio address may be shown (it is public on Pixieset). Do not submit inquiry data to a live service during prototype mode.
- Each session's Book button deep-links to its Pixieset session via `site.sessionBooking` in `src/content.js`.
- In session rows, keep the secondary “Ask about…” link directly beneath the black booking card instead of beside it.
- Alternating session rows mirror both their content order and their 5/6 column proportions; keep the photo and copy aligned toward the shared center gap so the visual spacing stays even.
- On Sessions and Business, the hang tag's title is the section heading (an `h2`); do not add a separate heading above it (user request, Oct 17, 2026).
- The home "Find your session." section lists every session (Oct 18, 2026): two rails of three equal-width hang tags (Graduation was made the same size as the others at the user's request), Graduation first, Portraits, Families, then Celebrations, Weddings, Business. Each session tag deep-links to its row (`/sessions#<slug>`); Business stays one card linking to `/business`.
- Each Sessions row links to its filtered Work view (`/work?filter=<Category>`) once that category has at least two portfolio photos.
- Inner-page heroes never leave the right side empty (user request, Oct 18, 2026): every page hero uses the split `PageHero` with a pinned photo on the right, chosen so it is not the first image directly below. Business is the exception because there is only one real business photo (the perfume, already used in the product section below): its hero holds a blank `GhostSlot` ("business photo goes here") until Hennessy sends a real product, listing or studio photo (user choice, Oct 18, 2026).
