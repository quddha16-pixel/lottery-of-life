# Get the Phase 3C preview onto your iPhone

Game commit: **ebff78983faa8e134fca900d93392b8ce922c3bc** (`feature/phase-3c-care`). It contains all four Phase 3C milestones, plus the earlier Phase 1/2/3/3B history. GitHub validation of the game passed 177 unit and 64 browser checks. This does not establish a working hosted preview.

## Shortest route: upload a tested ZIP

This route keeps main, develop and production unchanged. It needs no Cloudflare API token, GitHub secrets, deployment enable flag or PR merge. The connected account can prepare/download the GitHub artifact, but cannot sign in to or create a project in your Cloudflare account.

1. In Safari, sign in to [GitHub Actions for this repository](https://github.com/quddha16-pixel/lottery-of-life/actions/workflows/preview-package.yml). Open the latest successful **Package Phase 3C iPhone preview (no deployment)** run for `chore/development-preview-process`.
2. Under **Artifacts**, tap **lottery-of-life-iphone-preview-ebff789** and download its ZIP. If Artifacts is hidden, use Safari's page menu → **Request Desktop Website**. The download is in the Files app → Downloads. Keep the ZIP zipped. Use this built artifact rather than Code → Download ZIP.
3. Open the [Cloudflare dashboard](https://dash.cloudflare.com/), sign in/create a Free account, and go to **Workers & Pages**. Choose **Create application → Get started** under Pages → **Drag and drop your files** / **Upload assets**. Stay on the Free plan; no paid upgrade or custom domain is needed.
4. Create the separate project **lottery-of-life-preview** (or use an existing separate Direct Upload preview project). Tap the upload area's file picker, choose **Browse**, then the downloaded ZIP in Files → Downloads. Tap **Deploy site** / **Save and Deploy**. On an existing Direct Upload project choose **Create deployment → Preview**, branch `review`, and upload there.
5. Open the exact HTTPS URL Cloudflare returns. Follow its root link or add `/lottery-of-life/`. The page must show **DEVELOPMENT** and the full game SHA above. Send that exact URL back so Codex can verify the deployed metadata, every bundled file against the trusted artifact manifest, and actual browser actions/navigation/save-reload. Do not assume a guessed project URL is live.

Cloudflare may call a new preview project's first/default deployment “Production.” That label belongs to this separate project; the actual production game remains on GitHub Pages with its workflow disabled. Confirm the project is the separate preview project before uploading. Do not upload into any existing production project. Existing Git-integrated Pages projects cannot use dashboard drag-and-drop; use a separate Direct Upload project for this route.

The preview has a different origin and saves from the production website. It does not automatically import, copy or overwrite production progress. A backup import is an explicit test with a copy.

## What is already prepared

- The artifact-only GitHub workflow runs from the process branch, so no main merge is needed. It checks the exact pinned gameplay branch tip and develop ancestry, tests/builds that source, and applies the separately reviewed preview wrapper.
- No Cloudflare credential, `pages: write`, production deployment job or external publication is used. The only new output is a downloadable ZIP retained for 14 days. If it expires, Codex can prepare another artifact at the same pinned source after validation.
- The ZIP keeps the Vite base `/lottery-of-life/`, root redirect, local assets, existing browser save key and full source SHA. A narrow two-line DEVELOPMENT label leaves the main phone controls above navigation. `build-info.json` also records the separate packaging-tool commit, and `preview-manifest.json` binds the game source SHA to all deployed app-file hashes.
- The verifier takes the actual HTTPS URL and trusted downloaded artifact manifest. Metadata alone is not enough to mark the deployment verified. Passing the package workflow does not create a website.

## Optional later: one-click uploads from GitHub

Not required for the first manual preview. The separate `preview.yml` automation is prepared, but currently requires default-branch workflow bootstrap, a `development-preview` environment, approval policy, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PREVIEW_PROJECT`, and an explicitly enabled preview flag. No main merge or flag enablement is authorized by this guide.

Manual settings links for the owner:

- [GitHub environments](https://github.com/quddha16-pixel/lottery-of-life/settings/environments): create `development-preview`, add your required-reviewer approval, allow the trusted orchestration ref described in [release process](RELEASE_PROCESS.md).
- [Actions secrets](https://github.com/quddha16-pixel/lottery-of-life/settings/secrets/actions) / the environment's own secrets page: enter credentials there, never in chat or code.
- [Actions variables](https://github.com/quddha16-pixel/lottery-of-life/settings/variables/actions): the project name/integration name and preview enable flag are documented in the release process. Keep production releases disabled.
- [Cloudflare API tokens](https://dash.cloudflare.com/profile/api-tokens): a later automation token needs Pages Edit on the relevant account. Manual upload needs no token.

GitHub settings access remains limited: Actions-variable listing returns 403, and no development-preview environment is currently present. Previous settings writes returned 403. These approval/protection controls are not claimed active. This does not block the manual ZIP-upload route.

## Completion gates

- **Implemented:** tested source and preview package.
- **Hosted and verified:** only after an actual HTTPS URL serves the expected SHA/bytes and browser checks pass.
- **Playable:** Quentin personally opens that exact preview on his iPhone and reviews the changed experience.
- **Released:** a separately approved and verified production update. No production release is part of this setup.

Cloudflare's [official Direct Upload instructions](https://developers.cloudflare.com/pages/get-started/direct-upload/) confirm dashboard ZIP uploads and the distinction from Git integration. Menu wording may differ; Safari's desktop-site mode can expose hidden controls.
