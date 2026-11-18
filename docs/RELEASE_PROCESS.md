# Lottery of Life: review, preview and production

## Current verified structure

Original repository: `quddha16-pixel/lottery-of-life`. Default/production branch main remains `cf5a773aadd80a331d9857f12ff189c5773e9744`; develop was created and remains exactly `170323f831e340c4ee52997dc716cce910070fd5`. Historical phase branches are preserved. Phase 3C is stacked in PRs #4–#7; latest `feature/phase-3c-care` is `ebff78983faa8e134fca900d93392b8ce922c3bc`, four commits ahead of 170323f with no missing ancestry. Do not rewrite, force-push or delete history.

PR #1 establishes the existing Phase 2 production baseline at `79ca0bd` on main. PR #2 prepares the later production release process and is stacked after #1. PR #3 is process-only against develop. None is merged. Gameplay is paused for preview infrastructure and personal feedback.

## First preview: GitHub Pages only

Cloudflare has been cancelled. Its artifact job was cancelled and its registered workflow disabled. No Cloudflare account/project, credential or deployment was created. The former Cloudflare workflows/payloads are removed from these process branch heads, with their commits retained as history.

Use the separate public repository `quddha16-pixel/lottery-of-life-preview`, on the same existing GitHub account. [Simple iPhone setup](IPHONE_PREVIEW.md) requires repository creation by the owner (integration returned 403), and Source = GitHub Actions under that new repository's Pages settings if the integration cannot set it. Existing app access covers all repositories on this account. No new account, external provider, paid service, API token or broader administration grant is needed.

The preview repository contains only a small publishing workflow/configuration and build/verification scripts. It checks out the original game's exact selected commit, runs its existing checks, builds the correct preview asset base and an isolated save namespace, and publishes through the preview repository's own GitHub token/OIDC. Source game files remain unchanged. Its DEVELOPMENT label shows the full game SHA; metadata separates game and tooling commits and a manifest verifies published bytes. Actual phone-sized play checks assets, decisions, dialogs, route locks, keyboard behavior and reload while preserving production-key sentinels.

Expected address after successful deployment: `https://quddha16-pixel.github.io/lottery-of-life-preview/`. Never call it live/Playable until HTTPS, commit/bytes and browser behavior have actually been verified. Quentin's personal iPhone review remains the Playable gate. Original-repository main merges, release variables and environment protections are not prerequisites for this isolated preview.

## Production stays disabled

The original production Pages workflow is verified `disabled_manually`; the existing public site remains at `79ca0bd1c0a19dbdc8b3d5f894943bf7425b2dc8`. Do not re-enable production, merge into original main or dispatch a release without explicit approval. No production flags have been enabled by this work. Their current server-side values cannot be verified because Actions-variable access returns 403.

The prepared production workflow is manual-only, accepts a full exact main SHA and requires `PRODUCTION_RELEASES_ENABLED=true`. It runs lint/unit/browser/type/build checks, adds metadata without changing game bytes, uploads the tested artifact and deploys behind the original github-pages environment. It verifies public metadata and still requires actual navigation/assets/save checks. These workflow changes are unmerged; they are not claimed active protection.

After explicit future approval, merge PR #1 and then PR #2 with merge commits, retaining original SHAs and branches. Configure the owner controls below before enabling/dispatching any production release. Review integration promotions separately after iPhone feedback; a successful preview does not approve main merging or production publication.

## Original-repository settings requiring owner action

The integration returned 403 for branch protections, repository merge settings, environments and Actions variables. Prepared settings are documented, not active verified controls:

- Settings → Branches/Rules: main and develop require PRs and a passing `test` check, conversation resolution, no force pushes/deletions and administrator coverage. With a sole maintainer, preserve explicit owner approval without requiring an unavailable external reviewer.
- Settings → General: preserve merge commits, disable auto-merge and automatic branch deletion; avoid squashing/rebasing original history during consolidation.
- Original Settings → Environments → github-pages: owner reviewer with self-review allowed for the sole owner; deployment branch only main. Do not grant original production deployment to development branches.
- Original Actions variables: keep production releases false until those controls and exact release approval are verified.

Payloads for those future production settings remain in docs/repository-settings. Their presence does not apply any setting. The cancelled Cloudflare/preview credential requirements do not apply to the GitHub-only preview.

## Completion standard

**Implemented:** scoped code exists and appropriate checks pass, with limitations recorded. **Playable:** Quentin personally tests the exact verified HTTPS preview on his iPhone. **Released:** Quentin explicitly approves a production update, it is published, and its exact commit and player behavior are verified. Tests, package builds or deployment metadata alone do not establish the latter gates.
