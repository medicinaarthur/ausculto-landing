# Deploy config — RECONSTRUCTED, validate before any deploy

## Current main-site source (2026-09-14)

The `site` target now builds from `site/` into `dist/site`, using the preserved published snapshot as its baseline. Root `index.html` is not the source of this target. Existing `embaixadores/` edits are included by the build without changing their source. ENAMED remains a separate target and source at `enamed/index.html`.

Run `npm run build:site`, `npm run verify:site` and `npm run test:academy-content` for local validation. The build adds `/estudantes/` and `/conteudos/`. Without an explicitly approved release, it emits zero articles and discloses that the collection is under review. `node scripts/build-site.mjs --release <release.json>` accepts only reviewed public portions; never copy the protected release or PDFs into `site/`.

`dist/site-manifest.json` records the generated artifact hashes outside the public directory. Verification checks that artifact, so rebuild after changing any source. Build and verification do not publish. Production activation still depends on whole-corpus editorial clearance and the app's disabled-by-default release gates.

`firebase.json` and `.firebaserc` in this repo were **reconstructed on 2026-08-21 from observed live behavior** of https://auscultoapp.com (Firebase project `auscultoapp`, default Hosting site). They were **not** recovered from the original deploy source.

## Evidence used

## Continuous ENAMED candidate (local, not deployed)

`enamed/continuous.html` is the evergreen replacement candidate. Run `npm run test:enamed-continuous`, `npm run build:enamed-continuous`, and `npm run verify:enamed-continuous`. Its isolated allowlisted output is `dist/enamed-continuous`; source and artifact hashes must agree. The existing ads entry `enamed/index.html`, its build and production target remain intact. When this candidate is released, the ENAMED Hosting target must explicitly select this output; no current production command silently switches campaigns. The candidate uses absolute site/app links, canonical and sitemap for the ENAMED subdomain, and no live backend rewrites or tracking requests.

## Observed hosting evidence

- `/_bridge/appstore-click` returns `204 No Content` for both GET and POST with `Server: Google Frontend` + `X-Cloud-Trace-Context` headers → Cloud Function rewrite. Function name `recordAppStoreClick` per project convention (verify in Firebase console → Functions).
- Observed `Cache-Control` on live (2026-08-21):
  - `**/*.html` (explicit .html URLs, e.g. `/index.html`, `/ads-medico.html`, `/embaixadores/index.html`): `no-cache, no-store, must-revalidate`
  - `/` (directory index): `max-age=3600` (Firebase default — the `**/*.html` rule does not match `/`)
  - `**/*.css`, `**/*.js`: `public, max-age=3600, must-revalidate`
  - `**/*.png|jpg|jpeg|webp|ico` images: `public, max-age=86400`
  - everything else (`.mp4`, `.woff2`, `robots.txt`, `sitemap.xml`): `max-age=3600` (Firebase default, no rule needed)
- **2026-08-21 addition (ENAMED page):** the image rule was extended to `avif` and a `woff|woff2|ttf|otf` rule (`max-age=86400`) was added — these formats were not served by the live site at observation time, so there is no observed header to mirror; the 1-day value follows the existing image convention. Adjust if the real config differs.
- **2026-08-28 addition (partner portal):** target `parceiros` maps to
  `auscultoapp-parceiros` and publishes only `parceiros/public`. Its `/r/**`
  rewrite consumes `partnerLinkRedirect`; deploy and smoke test must be
  coordinated with the backend and Admin changes.
- 404 responses serve the default Firebase Hosting "Page Not Found" page (no custom `404.html`).

## Before running `firebase deploy`

1. Confirm with the project owner that this repo's working tree is the intended deploy content (note: `index.html` in the working tree intentionally differs from the currently-served one — owner's hero change).
2. Confirm the Functions consumed by the selected target exist in project
   `auscultoapp`: `recordAppStoreClick` for the landing and
   `partnerLinkRedirect` for the partner portal (`firebase functions:list`).
3. Confirm no additional Hosting config (cleanUrls, redirects, i18n, extra rewrites) exists in the real project — none were observable externally, but absence of evidence is not evidence of absence.
4. Prefer `firebase hosting:channel:deploy` (preview channel) over production deploy for the first validation.
