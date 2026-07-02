# Approval: Figma Postcard Plugin

**Approved by:** Drake (Session 44, 2026-04-13)
**Approval method:** Build skill Step 5 — interactive review throughout session

## What was reviewed

1. **Expert panel** — 9 experts synthesized (Gendusa, Draplin, Whitman, Halbert, Caples, Heath, Spiekermann, Albers, Brockmann). Drake reviewed scan results, approved skipping Mall (Medium-Low), approved adding 3 new experts.

2. **Brainstorm** — Plugin architecture presented. Drake stress-tested: caught missing complex shapes, missing card back, missing color adaptation, missing element inventory. All gaps addressed.

3. **Morphological box** — Gerstner-style element catalog created. Drake approved the architecture: plugin selects and assembles from parameterized components, not codes visual richness from scratch.

4. **Key decisions made:**
   - Path A (plugin) over Path B (manual + REST API) — plugin IS the product
   - 72 DPI canvas (natural point sizes)
   - Component library for decorative elements, code for simple shapes
   - Template = JSON selecting one component per morphological parameter
   - Colors from brand input, not hardcoded
   - This becomes a reusable `/postcard-template-design` skill
   - Figma desktop must be installed (downloaded, pending manual install)

5. **Review findings fixed:**
   - Zone ratios: exact deep spec percentages, not approximate ratios
   - Font choice: verify in hello-world, consider Bebas Neue
   - Color checks: moved from stretch to core
   - Demo photo: source from Pexels/Unsplash as pre-task
   - Z-order: specify creation order
   - QR: pre-generate PNG
   - Time estimate: revised to 6-8 hours

## What was NOT reviewed (out of scope for this approval)
- Card back layout (needs its own planning session)
- Production multi-template system (post-demo)
- REST API variable data injection (post-demo)
