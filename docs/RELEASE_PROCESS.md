# Repository organization and release process

Prepared 17 November 2026. **Infrastructure only. No Phase 3C gameplay implementation, PR merge, preview publication or production deployment is authorized by this preparation.** All new PRs require Quentin's explicit approval before merge. Each preview or production publication also requires explicit approval.

## First iPhone preview: no main merge required

The [iPhone preview guide](IPHONE_PREVIEW.md) now provides a shorter first-preview route: the artifact-only workflow packages the exact Phase 3C source on the process branch, and Quentin uploads its tested ZIP to a separate Cloudflare Pages Free Direct Upload project. No GitHub settings, Cloudflare API token, deployment flags or main merge are needed for this manual route. Source code and production remain unchanged. The full game SHA is visible; a manifest supports verification of the actual deployed bytes.

The main-bootstrap and environment/secret instructions below describe later automated uploads/releases. They are not prerequisites for this first manual preview. No website is considered hosted or Playable merely because packaging passes.

## Preserved history and the branch-name conflict

| Ref at the start of organization | SHA |
|---|---|
| `main` | `cf5a773aadd80a331d9857f12ff189c5773e9744` |
| `development/phase-1-foundation` | `79ca0bd1c0a19dbdc8b3d5f894943bf7425b2dc8` |
| `development/living-world-overhaul` | `79ca0bd1c0a19dbdc8b3d5f894943bf7425b2dc8` |
| `development/phase-3-wildlife-rpg` | `170323f831e340c4ee52997dc716cce910070fd5` |

Git cannot create a branch named `development` while `development/...` branches exist. GitHub rejected that exact request with HTTP 422. Do not rename/delete the phase branches to work around it. Quentin selected `develop`. It was created and independently verified at exactly `170323f831e340c4ee52997dc716cce910070fd5`; main remains `cf5a773`. The process-only PR is #3 against develop. Set `INTEGRATION_BRANCH=develop` when setting up previews (the prepared workflow also defaults to develop).

The latest source includes all six commits added since initial main; Phase 3 is two commits ahead of Phase 2 with zero commits behind. Existing phase branches remain unchanged as historical checkpoints. Normal merge commits preserve their original SHAs. Do not force-push, rebase existing history, delete phase branches or enable automatic branch deletion.

Target structure:

- `main`: approved production source, promoted only through reviewed PRs.
- Chosen integration branch: shared candidate development, initially the complete Phase 3/3B history at `170323f`.
- `feature/<topic>`, `fix/<issue>`: focused changes reviewed into integration.
- `chore/production-release-process`: Phase 2 baseline plus production/preview control tooling and documentation, reviewed into main after PR #1.
- `chore/development-preview-process`: the same process tooling on Phase 3, reviewed into the chosen integration branch.

No branch is automatically merged or deployed. The CI workflow covers both prospective root integration names, all legacy `development/**` branches, `main`, `feature/**`, `fix/**`, `chore/**`, and all pull requests, including stacked feature reviews. The required job remains named `test` so branch rules can select a stable check.

## PRs and bootstrap ordering

PR #1 is the **existing Phase 2 production baseline**, not a Phase 3 release. Its title/body are updated; its head and original commits are retained. The public site already serves `79ca0bd`. Merging #1 into main does not by itself deploy under its old push filter.

The production-process PR is based on `79ca0bd`, so before #1 is merged it also displays the baseline files already reviewed in #1. It is deliberately stacked: after #1 merges, its remaining diff is process-only. It does not contain Phase 3 gameplay. Do not replace PR #1's historical source branch with infrastructure commits.

After explicit approval, the order is:

1. Configure the manual protections below before accepting any releases.
2. Approve and merge PR #1 with a merge commit. Do not dispatch a release.
3. Approve and merge the production-process PR. Verify its workflows are discoverable on default branch main. No workflow dispatch is automatic.
4. Create/confirm the chosen integration branch at `170323f`; approve and merge its process-only PR. Synchronize approved main changes into integration through a reviewed PR, preserving both histories. Resolve any documentation conflicts without overwriting gameplay. Do not casually squash duplicated infrastructure commits.
5. Open/maintain a draft Phase 3 integration-to-main PR, explicitly listing the gameplay audit findings. Keep it unmerged until there is a reviewed candidate and Quentin approves.
6. When Quentin approves a preview of an exact integration SHA, dispatch the preview workflow from main with that SHA. Complete iPhone review and record evidence.
7. When Quentin approves a production candidate, approve its release PR and merge it into main. Record the resulting main SHA. Obtain approval for that exact release artifact and dispatch production manually; the environment requires an additional owner confirmation.
8. Verify the public build and actual game before recording Released. Keep all historical branches.

This document is an operating plan; it does not grant standing permission to merge or publish.

## Manual GitHub settings: integration returned 403

The connected GitHub integration can write PR metadata and ordinary branches. Attempts to update branch protection, repository merge settings, environments and Actions variables returned **403 Resource not accessible by integration**. Admin permission displayed for the account does not give the integration token those settings scopes. These settings have **not** been applied. No browser bypass or credential collection was attempted.

Quentin must configure them in the repository settings, or use his own appropriately authorized GitHub CLI session. Payloads are committed in `docs/repository-settings/`; commands below are for that authorized owner session, not something this PR automatically executes.

### 1. Pull request and history protections

Settings → Branches / Rules: protect `main` and the chosen integration branch.

- Require a pull request and the passing `test` status check; require the branch to be up to date.
- Require conversation resolution. Prevent force pushes and branch deletion. Apply the rules to administrators rather than silently bypassing them.
- Preserve explicit owner approval in the PR. The payload uses zero mandatory external approving reviews because a sole maintainer cannot approve his own PR. If another eligible reviewer is available, require one approval and dismiss stale approvals. Do not lock the owner out by requiring an unavailable reviewer.
- Use merge commits. Disable squash/rebase merge for initial consolidation so original commits remain in main. Disable auto-merge and automatic branch deletion.

From the repository, for example:

```sh
gh api --method PUT repos/quddha16-pixel/lottery-of-life/branches/main/protection --input docs/repository-settings/branch-protection.json
# Repeat for the approved integration name after it exists.
gh api --method PATCH repos/quddha16-pixel/lottery-of-life --input docs/repository-settings/repository-settings.json
```

### 2. Production environment

The existing production Pages workflow was explicitly disabled and GitHub verified `state: disabled_manually`. The already-published site remains online. Keep this workflow disabled; re-enabling it requires explicit approval after the new release controls are reviewed. No deployment flags were enabled.

Settings → Environments → `github-pages`:

- Required reviewer: `quddha16-pixel`. Allow that owner to approve a deployment he initiated; do not enable prevention of self-review for a sole-maintainer release process.
- Deployment branches: **only `main`**. Remove the old phase-1 allowance; this changes the environment policy, not the preserved branch.
- Do not add the development branch. Do not remove the reviewer to make a run pass.
- The existing Pages site and public deployment remain in place while these settings are changed. Keep Pages configured to use GitHub Actions and keep Vite base `/lottery-of-life/`.

The environment payload is `docs/repository-settings/production-environment.json`. After applying it, inspect deployment-branch policies and retain only main; the environment PUT alone does not remove existing individual branch policies.

### 3. Separate preview environment and free hosting

Selected host, confirmed by Quentin: **a separate Cloudflare Pages Free direct-upload project**. The workflow is prepared, not run; no Cloudflare account/project or paid service was created. No temporary tunnel or paid infrastructure is used.

Create an account/project on the Free plan, e.g. `lottery-of-life-preview`, as a **direct-upload** project without automatic Git-connected deployments. A CLI owner can create it with a reserved production branch name such as `preview-live`; our integration branch then uses Cloudflare's preview branch alias. The actual production game stays on GitHub Pages.

Settings → Environments → create `development-preview`:

- Required reviewer: `quddha16-pixel`.
- Allowed workflow deployment ref: **main**. Main is the trusted orchestrator; the workflow independently checks and builds the exact approved development candidate SHA. The preview artifact is not main's gameplay. This avoids granting deployment credentials to development code.
- Environment secrets: `CLOUDFLARE_API_TOKEN` (Pages-edit permission scoped to the relevant Cloudflare account) and `CLOUDFLARE_ACCOUNT_ID`.
- Environment variable: `CLOUDFLARE_PREVIEW_PROJECT` = the separate Free project name.
- Never paste credentials into chat, PRs, code or workflow inputs. The token is available only to the final upload step, not the untrusted-source build.

The prepared environment payload is `docs/repository-settings/preview-environment.json`. Its individual branch policy must be main, for the trusted orchestration described above.

### 4. Actions variables and enable flags

Settings → Secrets and variables → Actions → Variables:

- `INTEGRATION_BRANCH`: `develop`.
- `PRODUCTION_RELEASES_ENABLED`: keep `false` until production approvals and main-only environment policy are verified.
- `DEVELOPMENT_PREVIEWS_ENABLED`: keep `false` until the separate Free preview project, environment, credentials and approval policy are verified.

Only then set the corresponding flag to `true` when ready for a separately approved dispatch. Undefined/non-true flags fail the preflight check. The integration could neither read nor set these variables, so current values could not be verified; explicitly check them before merging the workflow changes. Manual-only triggers also prevent branch pushes/PRs from publishing.

## Publishing a development preview, later and only on approval

The workflow must first exist on default branch main. After Quentin approves previewing an exact integration commit:

1. Actions → **Development preview (not production)** → Run workflow from `main`.
2. Enter the approved source branch (`develop` or a `feature/` / `fix/` branch) and full SHA. Preflight confirms the branch tip matches that SHA and contains the current develop history. This allows iPhone review of unmerged feature work; it does not authorize merging it. A moved tip requires a newly reviewed candidate, not silent substitution.
3. It checks out trusted tooling from main and development source at the immutable SHA, runs lint/unit/browser/build checks, and packages the existing Vite base path.
4. The preview environment requests owner approval before upload. The upload job downloads only static artifacts and uses pinned Wrangler `4.164.0`; development build scripts never receive the Cloudflare token.
5. Open the HTTPS link in the Actions summary on the iPhone: the immutable deployment URL printed by Wrangler, followed by `/lottery-of-life/`. The workflow extracts and verifies that exact URL; it does not invent a live link or rely on a moving branch alias.
6. The page title and visible ribbon identify DEVELOPMENT PREVIEW; the narrow in-flow ribbon is paired with a shorter mobile scene so it does not push primary choices under navigation. Its accessible label names the full SHA and states that it is not a production release. Metadata says `channel: preview` and names the source SHA. This host has a different origin/storage from production. It neither copies nor overwrites production saves. Use explicit save export/import only when a migrated-copy test is intended.
7. Record actual observations. A successful upload/metadata check is not the Playable milestone until Quentin personally tests the changed experience on his iPhone.

No ready iPhone preview URL exists merely because this workflow is prepared. Automated uploads require hosting setup, approved workflow bootstrap and an explicitly approved run; the manual ZIP route above avoids the main-merge and secret requirements.

## Publishing production, later and only on approval

Actions → **Release Lottery of Life to GitHub Pages** → Run from `main`, providing its full explicitly approved SHA. Preflight rejects other branches, non-full SHAs, mismatched commits and disabled releases. Build runs checks once, adds only `build-info.json`, and uploads that tested artifact. The `github-pages` owner approval gate precedes deployment. Only the deploy job has `pages: write` and `id-token: write`.

The metadata check verifies `https://quddha16-pixel.github.io/lottery-of-life/build-info.json` names the approved SHA and `channel: production`. Then verify the main menu/active life, assets, hash navigation/back, mobile input, existing save migration, reload and any changed feature. The pipeline's metadata success alone does not certify those player checks.

If verification fails, do not mark Released. Report the exact problem and request approval for a rollback/fix. A rollback is another explicit release decision; never force-reset main or silently replace the website.

## Milestone record for every phase

- **Implemented:** scoped code exists, appropriate checks pass, known limitations listed.
- **Playable:** Quentin personally tests the exact candidate's new experience on his iPhone. Record preview URL/SHA and observations. Chromium emulation is additional evidence only.
- **Released:** Quentin approves the candidate; production is updated and verified at the approved commit with actual player checks.

Infrastructure preparation currently satisfies none of the missing Phase 3 player-experience gates. The [Phase 3C plan](PHASE3C_PLAN.md) is approved for implementation; progress is tracked in separate feature PRs. Neither this infrastructure branch nor its checks establish Phase 3C completion.
