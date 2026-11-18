# Phase 3C iPhone preview — GitHub Pages only

Cloudflare is cancelled. No external hosting, new account, API token or paid service is required.

## One-time owner setup on iPhone

1. Open [Create repository](https://github.com/new?name=lottery-of-life-preview&visibility=public), sign in to your existing GitHub account, and create **quddha16-pixel/lottery-of-life-preview**. Choose **Public** and turn on **Add a README**. GitHub returned 403 when the connected integration tried repository creation, so this step requires the owner.
2. In the new preview repository only, open [Settings → Pages](https://github.com/quddha16-pixel/lottery-of-life-preview/settings/pages). Under Build and deployment → Source choose **GitHub Actions**. If the integration can configure this after creation, Codex will do it; otherwise this is the only other owner setting needed. On Safari use the page menu → Request Desktop Website if Settings/Pages is hidden.
3. Tell Codex the repository exists. The existing GitHub connection already covers all repositories on this account; no broader access, token or additional account is needed.

Codex will install the prepared workflow in the preview repository, build and test the pinned game commit, deploy there, and verify the actual HTTPS page and bytes. No original main merge, production deployment or deployment flag is needed.

## Exact source and expected address

Game source: **ebff78983faa8e134fca900d93392b8ce922c3bc** in the existing `feature/phase-3c-care` branch of `quddha16-pixel/lottery-of-life`. It contains all four Phase 3C commits, plus all previous Phase 1/2/3/3B history through `170323f`.

Expected address after deployment: `https://quddha16-pixel.github.io/lottery-of-life-preview/`. This is an expected address, **not a claim that a live preview exists**. Use it only after the deploy and verification succeed.

The preview repository contains publishing tools only. Its own default/main branch does not receive or merge game-development history. All gameplay stays in the original repository's existing development branches, selected by full immutable SHA in `preview.json`.

## Production and save preservation

Original main remains `cf5a773`; develop remains `170323f`; all historical phase branch tips remain unchanged. Original production Pages remains disabled and its current public deployment remains `79ca0bd`. No production settings/flags or website are changed by the preview repository.

GitHub project sites on one account share an origin. The preview must therefore use both a separate asset base (`/lottery-of-life-preview/`) and separate save/backup keys (`lottery-of-life-preview.save.v1` and `.backup`). The publishing adapter applies this only to the preview bundle in memory. Original game source files, production keys and saved data are unchanged. The browser test seeds production-key sentinels and confirms they are untouched through starting a life, actions and reload.

The visible DEVELOPMENT label includes the complete game SHA. Build metadata records the game SHA separately from the preview-tooling commit; a hash manifest lets verification compare all published app bytes with the tested artifact. The workflow uses only the preview repository's built-in GitHub token and Pages OIDC permissions, with no cross-repository write credential or secret.

## Status and review

The game commit's GitHub validation passed 177 unit tests and 64 browser checks. The new hosting adapter additionally tests the actual preview path, production-save isolation, current actions, route/dialog/keyboard behavior, phone layout, assets and reload. Local checks do not establish a live HTTPS preview.

After the URL is verified, Quentin can personally review it on his iPhone. The Playable milestone remains pending that personal review; Released requires a separately approved production update. Gameplay development is paused for preview setup and feedback.

Existing original-repository branch/environment/variable settings that returned 403 remain documented manual requirements for the future production release process. They do not block this isolated preview. No Cloudflare project, credential, workflow or upload is needed.
