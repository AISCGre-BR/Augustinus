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
-   **Main Component**: `src/App.vue` manages the state and layout.
-   **Rendering**: Uses `@testneumz/nabc-lib` (Gregorio-based) to render GABC into SVG in real-time.
-   **Dynamic UI**: The options grid is generated at runtime based on the `parameterDefinitions` exported by the core.

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
3.  The UI will update automatically.
4.  Add a test case to `test/small-test-cases.ts` and run `bun test`.
