# Augustinus Codebase Structure

This document explains the organization and architecture of the Augustinus project.

## Project Overview

Augustinus is a monorepo managed with **Bun** and **Vite**. It is split into three main packages:

-   `packages/core`: The musical engine that transforms text into GABC notation.
-   `packages/frontend`: A Vue 3 web application for interactive use.
-   `packages/cli`: (Future/Placeholder) A command-line interface for batch processing.
-   `packages/latex`: A LaTeX package providing macros for stacking and musical formatting.

---

## 1. Core Engine (`packages/core`)

The core is designed to be modular and highly maintainable. Its primary entry point is `src/augustinus.ts`.

### Directory Structure
-   `src/types/`: Contains the **Single Source of Truth** for parameters and models.
-   `src/core/`: Contains orchestration logic like parameter preprocessing.
-   `src/modules/`: Isolated musical logic:
    -   `apply-model.ts`: Maps lyrics to GABC patterns.
    -   `psalm-logic.ts`: Handles the complex logic of psalm tones and stanzas.
-   `src/utils/`: General text and musical utility functions.
-   `assets/`: Contains `models.json`, which defines the standard musical tones (Prefaces, Collects, Psalms).

### Dynamic Parameter System
Augustinus uses a metadata-driven parameter system defined in `src/types/index.ts`:
1.  **Definitions**: The `parameterDefinitions` array defines every option, its label, group, type, and default value.
2.  **Types**: The `Parameters` TypeScript interface is **dynamically generated** from these definitions using mapped types.
3.  **UI**: The frontend automatically iterates over these definitions to render the control panel.

---

## 2. Frontend (`packages/frontend`)

The frontend is a modern **Vue 3** application using the **Composition API**.

-   **Framework**: Vue 3 + Vite + TypeScript.
-   **Routing**: One page per chant type, addressed by hash (`#/prefacios`). Implemented in
    `src/router.ts` (no `vue-router`) because the site is served statically from GitHub Pages,
    where path routing would 404 on refresh.
-   **Rendering**: Uses `@testneumz/nabc-lib` (Gregorio-based) to render GABC into SVG, wrapped
    in `src/render.ts`.
-   **State**: `src/store.ts` holds a reactive store persisted to `localStorage`
    (`augustinus:v1`). Lyrics, GABC and tone are kept per page; parameters, zoom and the GABC
    header are global.
-   **Dynamic UI**: Controls are generated at runtime from the `parameterDefinitions` exported
    by the core, filtered by `optionApplies` so that parameters the core ignores for the chosen
    model are not shown.

### Directory Structure

-   `src/chant-pages.ts`: **Single Source of Truth** for the navigation — which chant types
    exist, which models each one offers, and which parameters it highlights.
-   `src/router.ts`, `src/store.ts`, `src/render.ts`: routing, persistence, score rendering.
-   `src/App.vue`: shell (header + current page).
-   `src/components/`:
    -   `HomePage.vue`: the chant-type cards.
    -   `ChantPage.vue`: tone picker, essential options, lyrics, GABC and preview.
    -   `AdvancedOptions.vue`: the collapsed drawer with the technical parameters.
    -   `ChantPreview.vue`: A4 viewport, zoom and printing.
-   `src/style.css`: global theme (palette, form controls, print rules).

See `DETAILS.md` for the reasoning behind each of these.

---

## 3. LaTeX Package (`packages/latex`)

A temporary package that defines macros for use with `stackengine`.

-   **Purpose**: Provides the `\stacktext` and other related macros used by Augustinus' stacking feature.
-   **Structure**: Contains the `augustinus.sty` file and an installation script.

---

## 4. Testing System (`test/`)

Augustinus maintains high reliability through a two-tier testing system:

1.  **Functional Unit Tests**: Located in `test/augustinus.test.ts`. These verify the logical correctness of the GABC generation using `vitest`.
2.  **Visual Parity Reports**: Located in `test/visual-report.ts`. This script generates side-by-side PDFs comparing Augustinus output with manual references using `lualatex` and `gregorio`.
    -   Run with: `bun test:visual`
    -   Outputs: `test/visual/output/`

---

## Adding New Features

To add a new parameter to Augustinus:
1.  Add the definition to `packages/core/src/types/index.ts`.
2.  Implement the logic in the relevant module in `packages/core/src/modules/`.
3.  If it only applies to some models, add the rule to `optionApplies` in
    `packages/frontend/src/chant-pages.ts`, and list its key in the `optionKeys` of the page
    where it should be prominent. Otherwise it appears under "Opções avançadas" automatically.
4.  Add a test case to `test/small-test-cases.ts` and run `bun test`.

To add a new chant type, append an entry to `chantPages` in
`packages/frontend/src/chant-pages.ts`; the home page and the route follow from it.
