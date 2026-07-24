# 标签打印中心 Design QA

## Evidence

- Source visual truth: `C:\Users\SHICHANG\.codex\generated_images\019f8c7e-6302-7d13-acd4-9bab69faa822\call_KTHLSp5x6BvqOFUa8dbtV9By.png`
- Browser-rendered implementation: `C:\Users\SHICHANG\Documents\商品库编码\.codex-label-implementation-final.png`
- Side-by-side comparison: `C:\Users\SHICHANG\Documents\商品库编码\.codex-label-comparison.png`
- Route: `http://127.0.0.1:3211/labels` using an isolated QA database
- Viewport: 1440 × 1024 CSS px
- Source pixels: 1487 × 1058
- Implementation pixels: 1440 × 1024
- Density normalization: both images were fit without cropping to 1440 × 1024 before being placed side-by-side.
- State: desktop, 100×100 mm selected, one SKU selected, manufacturer/Cainiao/platform/note content enabled.

## Full-view comparison

The implementation preserves the selected concept’s three-zone hierarchy: batch queue, dominant measured preview, and content inspector. It retains the existing product’s blue/white tokens, compact sidebar, restrained dividers, clear primary print action, millimeter rulers, and black-on-white label surface.

The implementation intentionally keeps the current application’s narrower sidebar and header rather than replacing the product shell with the concept shell. The physical preview uses true CSS millimeter proportions; screen-only scaling improves inspection without changing print dimensions.

## Focused-region comparison

The label region was inspected separately at both 70×50 and 100×100. Code 128 canvases reported non-zero rendered dimensions. The 100×100 label contains a dominant internal barcode plus smaller manufacturer, Cainiao, and platform barcodes. The 70×50 template keeps the internal code and main barcode as the primary scan target.

## Required fidelity surfaces

- Fonts and typography: existing Noto Sans SC/system typography is retained in the admin UI; label typography uses a printer-safe Arial/Noto Sans SC stack with stronger optical weights for internal codes.
- Spacing and layout rhythm: primary columns, command bar, separators, settings rows, and measured canvas follow the source hierarchy. True-mm label size is preserved independently from screen preview scale.
- Colors and visual tokens: existing `--blue`, surface, line, muted, and semantic state tokens match the source’s restrained blue/white system.
- Image quality and assets: Tabler icons are used consistently. Product imagery is displayed only when a real saved image URL exists; no fake placeholder or CSS illustration is substituted.
- Copy and content: all controls use concise Simplified Chinese. Internal code immutability is preserved, and labels clearly distinguish manufacturer, Cainiao, and platform codes.

## Interaction verification

- Switched between 70×50 mm and 100×100 mm.
- Enabled manufacturer, Cainiao, platform, and note fields.
- Added all visible SKUs to the queue.
- Verified 3 selected queue rows produced 3 print-only label nodes and updated the print total to 3.
- Verified product-level and per-SKU quick-print links.
- Verified preference persistence after reload.
- Verified barcode canvases rendered non-zero sizes.
- Checked browser console warnings/errors: none.
- Automated tests: 6 passed.
- TypeScript check: passed.
- Next.js production build: passed.

## Comparison history

### Iteration 1

- [P1] Global `aside` styles leaked into the queue and settings panels, pushing the settings inspector outside the intended desktop grid.
- Fix: reset position, height, top, and padding for nested queue/settings asides.
- Post-fix evidence: all three columns are visible at 1440 × 1024.

- [P2] The initial 100×100 preview was visually undersized and used too little of the label surface compared with the selected design.
- Fix: increased screen-only preview scale and strengthened 100×100 typography, main barcode height, secondary barcode height, and spacing.
- Post-fix evidence: the label is now the visual center of the workspace while physical print dimensions remain exactly 100 mm.

- [P2] The print action initially sat in the title row instead of the source design’s command area.
- Fix: moved the primary print action to the right side of the command bar.
- Post-fix evidence: paper size, quantity, reset, calibration summary, and print action now form one coherent control line.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] A real product image was unavailable in the isolated QA data; image layout is conditionally supported and the toggle correctly explains when no image is configured.
- [P3] Exact physical printer feed accuracy still requires one real test print because driver margins vary by printer model.

final result: passed
