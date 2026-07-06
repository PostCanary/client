<script setup lang="ts">
// Schematic wireframe preview for a template layout (POS-118). Renders a
// small SVG sketch of each layout's actual structure — photo regions as
// neutral gray blocks with an image glyph, headline as dark bars, an
// offer/coupon strip, and a bottom business strip — so the template picker
// shows shape, not just a name. Each layout gets a structurally distinct
// markup driven off its id; geometry is data, assembled by a handful of
// shared atom builders below.
import { computed } from "vue";
import type { TemplateLayoutType } from "@/types/campaign";

const props = withDefaults(
  defineProps<{
    layout: TemplateLayoutType;
    accent?: string;
  }>(),
  { accent: "#47bfa9" },
);

// 150x100 viewBox = 1.5:1, matching the 6x9 postcard aspect ratio.
const VB_W = 150;
const VB_H = 100;

const PHOTO_FILL = "#d1d5db";
const PHOTO_GLYPH = "#ffffff";
const INK = "#0b2d50";
const PAPER = "#f6f1e7";

function photoBlock(x: number, y: number, w: number, h: number): string {
  const glyphR = Math.min(w, h) * 0.14;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${PHOTO_FILL}"/>
    <circle cx="${x + w * 0.28}" cy="${y + h * 0.3}" r="${glyphR}" fill="${PHOTO_GLYPH}" fill-opacity="0.6"/>
    <path d="M${x + w * 0.06} ${y + h * 0.88} L${x + w * 0.32} ${y + h * 0.52} L${x + w * 0.5} ${y + h * 0.7} L${x + w * 0.72} ${y + h * 0.4} L${x + w * 0.96} ${y + h * 0.88} Z" fill="${PHOTO_GLYPH}" fill-opacity="0.45"/>
  `;
}

function bar(
  x: number,
  y: number,
  w: number,
  h: number,
  fill = INK,
  opacity = 1,
  rx = 1.5,
): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" fill-opacity="${opacity}"/>`;
}

function dashedChip(x: number, y: number, w: number, h: number, stroke: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="3,2"/>`;
}

function star(cx: number, cy: number, r: number, fill: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
}

function pin(cx: number, cy: number, r: number, fill: string): string {
  return `
    <path d="M${cx} ${cy + r * 2} C${cx - r} ${cy + r * 0.6} ${cx - r} ${cy - r} ${cx} ${cy - r} C${cx + r} ${cy - r} ${cx + r} ${cy + r * 0.6} ${cx} ${cy + r * 2} Z" fill="${fill}"/>
    <circle cx="${cx}" cy="${cy - r * 0.15}" r="${r * 0.32}" fill="${PAPER}"/>
  `;
}

function checkRow(x: number, y: number, w: number, accent: string): string {
  return `
    <circle cx="${x + 3}" cy="${y}" r="3" fill="${accent}"/>
    <path d="M${x + 1.4} ${y} l1.3 1.3 l2.4 -2.6" stroke="${PAPER}" stroke-width="0.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${bar(x + 10, y - 1.6, w, 3.2, "#9aa5b1", 1)}
  `;
}

function numberRow(x: number, y: number, w: number, n: number, accent: string): string {
  return `
    <circle cx="${x + 3.2}" cy="${y}" r="3.6" fill="none" stroke="${accent}" stroke-width="1.2"/>
    <text x="${x + 3.2}" y="${y + 1.6}" font-size="4.2" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-weight="600">${n}</text>
    ${bar(x + 11, y - 1.6, w, 3.2, "#9aa5b1", 1)}
  `;
}

function wavyLine(x: number, y: number, w: number, stroke = "#7a8595"): string {
  const segs = Math.max(2, Math.round(w / 10));
  let d = `M${x} ${y}`;
  for (let i = 1; i <= segs; i++) {
    const sx = x + (w / segs) * i;
    const sy = y + (i % 2 === 0 ? 2.2 : -2.2);
    d += ` Q${x + (w / segs) * (i - 0.5)} ${sy} ${sx} ${y}`;
  }
  return `<path d="${d}" stroke="${stroke}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
}

const svgInner = computed(() => {
  const accent = props.accent;
  switch (props.layout) {
    case "full-bleed":
      return `
        ${photoBlock(0, 0, 150, 100)}
        ${bar(0, 62, 150, 38, "#000000", 0.38, 0)}
        ${bar(10, 70, 78, 9, PAPER, 1)}
        ${bar(10, 83, 55, 6, PAPER, 0.75)}
        ${bar(0, 92, 150, 8, accent)}
      `;
    case "side-split":
      return `
        ${photoBlock(0, 0, 68, 100)}
        ${bar(80, 14, 62, 11, INK)}
        ${bar(80, 30, 44, 5.5, "#9aa5b1")}
        ${dashedChip(80, 44, 62, 22, accent)}
        ${bar(88, 51, 46, 7, accent, 0.85)}
        ${bar(80, 90, 62, 6, accent, 0.6)}
      `;
    case "photo-top":
      return `
        ${photoBlock(0, 0, 150, 44)}
        ${bar(10, 54, 100, 10, INK)}
        ${dashedChip(10, 70, 130, 15, accent)}
        ${bar(16, 75, 90, 5, accent, 0.85)}
        ${bar(0, 92, 150, 8, accent)}
      `;
    case "photo-hero":
      return `
        ${photoBlock(4, 4, 142, 92)}
        ${bar(18, 38, 114, 26, "#000000", 0.42, 2)}
        ${bar(28, 46, 94, 11, PAPER)}
        ${bar(28, 60, 60, 5.5, PAPER, 0.8)}
      `;
    case "new-mover":
      return `
        <path d="M20 55 L20 82 L60 82 L60 55 L40 38 Z" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="1.6"/>
        <rect x="35" y="65" width="10" height="17" fill="${accent}"/>
        ${photoBlock(95, 10, 45, 40)}
        ${bar(10, 90, 60, 6, INK)}
        ${bar(70, 60, 65, 9, INK)}
        ${bar(70, 74, 50, 5.5, "#9aa5b1")}
      `;
    case "bold-graphic":
      return `
        <rect x="0" y="0" width="150" height="100" fill="${accent}"/>
        <polygon points="0,0 60,0 0,100" fill="#ffffff" fill-opacity="0.12"/>
        ${bar(28, 36, 96, 18, PAPER)}
        ${bar(28, 60, 62, 10, PAPER, 0.75)}
      `;
    case "before-after":
      return `
        ${photoBlock(5, 8, 66, 66)}
        ${bar(5, 78, 66, 6, "#9aa5b1")}
        <line x1="75" y1="6" x2="75" y2="86" stroke="${accent}" stroke-width="1.6" stroke-dasharray="2,2"/>
        ${photoBlock(79, 8, 66, 66)}
        ${bar(79, 78, 66, 6, accent, 0.85)}
        ${bar(50, 90, 50, 6, INK)}
      `;
    case "review-forward":
      return `
        <text x="12" y="34" font-size="30" font-family="Georgia, serif" fill="${accent}" fill-opacity="0.5">&#8220;</text>
        ${star(30, 46, 4.5, accent)}
        ${star(41, 46, 4.5, accent)}
        ${star(52, 46, 4.5, accent)}
        ${star(63, 46, 4.5, accent)}
        ${star(74, 46, 4.5, accent)}
        ${bar(22, 56, 106, 6, INK)}
        ${bar(22, 66, 86, 5, "#9aa5b1")}
        ${bar(22, 82, 40, 5.5, accent, 0.85)}
      `;
    case "service-checklist":
      return `
        ${bar(10, 12, 70, 8, INK)}
        ${checkRow(12, 32, 90, accent)}
        ${checkRow(12, 44, 78, accent)}
        ${checkRow(12, 56, 100, accent)}
        ${checkRow(12, 68, 65, accent)}
        ${bar(10, 86, 130, 7, accent, 0.85)}
      `;
    case "urgency-notice":
      return `
        <rect x="0" y="0" width="150" height="18" fill="${INK}"/>
        <g fill="#ffffff" fill-opacity="0.15">
          <polygon points="0,0 8,0 0,18"/>
          <polygon points="20,0 28,0 12,18 4,18"/>
          <polygon points="40,0 48,0 32,18 24,18"/>
        </g>
        ${bar(10, 4, 90, 8, PAPER)}
        <polygon points="14,44 22,58 6,58" fill="none" stroke="${accent}" stroke-width="1.6"/>
        <rect x="13.2" y="47" width="1.6" height="6" fill="${accent}"/>
        <circle cx="14" cy="55.5" r="1" fill="${accent}"/>
        ${bar(30, 42, 108, 14, INK)}
        ${bar(30, 62, 70, 6, "#9aa5b1")}
        ${bar(0, 92, 150, 8, accent)}
      `;
    case "tips":
      return `
        ${bar(10, 10, 80, 8, INK)}
        ${numberRow(12, 32, 100, 1, accent)}
        ${numberRow(12, 46, 88, 2, accent)}
        ${numberRow(12, 60, 96, 3, accent)}
        ${dashedChip(10, 76, 130, 16, accent)}
        ${bar(16, 81, 90, 6, accent, 0.85)}
      `;
    case "letter-note":
      return `
        <rect x="0" y="0" width="150" height="100" fill="${PAPER}"/>
        ${wavyLine(14, 20, 100)}
        ${wavyLine(14, 32, 122)}
        ${wavyLine(14, 44, 90)}
        ${wavyLine(14, 56, 110)}
        <text x="14" y="78" font-size="9" font-family="Georgia, serif" font-style="italic" fill="${INK}">P.S.</text>
        ${dashedChip(34, 70, 100, 14, accent)}
        ${bar(40, 74.5, 70, 5, accent, 0.85)}
      `;
    case "neighborhood-map":
      return `
        <rect x="0" y="0" width="150" height="100" fill="#e8edf1"/>
        <g stroke="#c3ccd4" stroke-width="2">
          <line x1="0" y1="30" x2="150" y2="24"/>
          <line x1="0" y1="66" x2="150" y2="72"/>
          <line x1="40" y1="0" x2="34" y2="100"/>
          <line x1="104" y1="0" x2="110" y2="100"/>
        </g>
        ${pin(48, 44, 6, accent)}
        ${pin(102, 56, 5, "#7a8595")}
        ${pin(70, 24, 4.5, "#7a8595")}
        ${bar(0, 78, 150, 22, "#000000", 0.32, 0)}
        ${bar(10, 84, 110, 8, PAPER)}
        ${bar(10, 94, 60, 3, PAPER, 0.7)}
      `;
    default:
      return photoBlock(0, 0, 150, 100);
  }
});
</script>

<template>
  <svg
    :viewBox="`0 0 ${VB_W} ${VB_H}`"
    class="w-full h-full block"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    :aria-label="`${layout} layout preview`"
  >
    <rect x="0" y="0" :width="VB_W" :height="VB_H" fill="#f3f4f6" />
    <g v-html="svgInner" />
  </svg>
</template>
