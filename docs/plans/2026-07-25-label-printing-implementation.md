# Label Printing Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a production-ready browser-based thermal-label workflow for 70×50 mm and 100×100 mm stock, with quick print, batch selection, configurable content, live preview, and calibration.

**Architecture:** A server page loads active product/SKU relations and serializes them into a client-side print center. The client owns transient queue, template, field, quantity, and calibration state; a print-only DOM is expanded by quantity and rendered with physical CSS units. Existing Prisma data remains the source of truth and no printing state is written to the database.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Prisma/SQLite, bwip-js Code 128 canvases, CSS `@media print` and dynamic `@page`.

---

### Task 1: Define print-domain helpers

**Files:**
- Create: `src/lib/labels.ts`
- Create: `src/lib/labels.test.ts`

**Steps:**
1. Write tests for search matching, external-code selection, total-copy calculation, and printable-item expansion.
2. Run `npm test` and verify the new tests fail.
3. Implement pure typed helpers used by the UI.
4. Run `npm test` and verify all tests pass.

### Task 2: Build reusable printable barcode

**Files:**
- Create: `src/components/label-barcode.tsx`

**Steps:**
1. Add a client canvas component backed by `bwip-js`.
2. Support compact and primary heights while keeping Code 128 quiet zones.
3. Verify blank values do not attempt barcode generation.

### Task 3: Add the label printing center

**Files:**
- Create: `src/app/labels/page.tsx`
- Create: `src/app/labels/label-print-center.tsx`
- Modify: `src/app/layout.tsx`

**Steps:**
1. Query active products, active SKUs, external codes, listings, and SKU mappings.
2. Serialize each SKU into a print-safe view model.
3. Implement search, queue selection, per-SKU quantity, paper-size switch, content toggles, custom note, and selected-item navigation.
4. Persist calibration and content preferences to browser local storage.
5. Add the 标签打印 navigation entry.

### Task 4: Implement physical label templates and browser printing

**Files:**
- Modify: `src/app/labels/label-print-center.tsx`
- Modify: `src/app/globals.css`

**Steps:**
1. Implement the selected “preview-first” desktop layout.
2. Build separate 70×50 mm and 100×100 mm label compositions.
3. Expand the print DOM by requested copy count.
4. Inject the selected `@page` size before `window.print()`.
5. Add print-only rules with zero page margin, one label per page, exact dimensions, and calibration transforms.
6. Add responsive behavior for smaller screens.

### Task 5: Add quick-print entry points

**Files:**
- Modify: `src/app/products/[id]/page.tsx`

**Steps:**
1. Add a product-level 标签打印 action.
2. Add per-SKU quick-print links carrying the SKU query parameter.
3. Verify inactive SKUs do not expose a new print action.

### Task 6: Verify behavior and visual fidelity

**Files:**
- Create: `design-qa.md`

**Steps:**
1. Run `npm test`, `npx tsc --noEmit`, and a production build.
2. Open the selected visual reference and the local implementation at the same desktop viewport.
3. Test search, selection, quantities, size switching, toggles, calibration, and print invocation.
4. Compare the implementation screenshot with the selected reference.
5. Fix P0/P1/P2 issues and repeat until `design-qa.md` says `final result: passed`.

### Task 7: Version-control handoff

**Steps:**
1. Review the complete diff and ensure runtime databases, backups, and generated reference images are excluded.
2. Stage the source, tests, and documentation.
3. Commit with `feat: add professional label printing`.
4. Push the current branch to `zsczgg/shangjiabianma`.
