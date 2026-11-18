# Phase 1 implementation plan

Repository: `quddha16-pixel/lottery-of-life`. Default branch: `main`.
Working branch: `development/phase-1-foundation`.
Official project name: **Lottery of Life**. Product strings are centralized in `src/App.tsx`.

The initial checkout contained an initial README commit and the uncommitted React/TypeScript/Vite scaffold from the preceding setup task. Preserve and complete that scaffold; do not touch unrelated repositories.

## Delivery sequence

1. **Core foundation (A):** typed species and scenario catalogs; seeded random generator; pure simulation functions; modern, range-valid births; four phase daily decisions; browser save and recovery; responsive primary UI.
2. **Survival slice (B):** developmental action gating, resource costs, injuries, exposure, mortality, journal and irreversible lifetime records. One shared phase engine for manual and skipped play.
3. **Progression slice (C):** lifetime-only reward settlement, ten founding unlocks, three extra species, one transparent pack and duplicate conversion.
4. **Generational slice (D):** modest inheritance, sampled cohorts, background family aging and mortality, takeover of a surviving direct offspring without world reset.
5. **Validation and preparation (E):** Vitest invariants; desktop/mobile Playwright flows against the production bundle; static Pages configuration and CI; assumptions, sources and deferred complexity documented.

This is a playable vertical foundation. It is not the completed ecological, historical or genetics simulation envisioned for later phases. See `MODEL_NOTES.md` for explicit limits.
