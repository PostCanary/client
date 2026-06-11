// Seeding-only port of render_worker/services/headline_splitter.py.
//
// Line-level editing (S72): cards carry explicit HeadlineLines that the
// renderer prints verbatim. This splitter runs ONCE — at card generation
// (or first edit of a legacy card) — to distribute the AI headline into
// the 5 slots as a starting point. From then on the lines are the source
// of truth, so drift between this port and the Python original can never
// cause a visual mismatch; the worker renders the seeds, not its own split.
//
// Deliberate difference from the Python original: NO default backfill.
// The Python splitter pads empty slots with template copy ("on a TRUSTED
// SERVICE!") — the exact uneditable-filler problem this feature removes.
// Short headlines seed fewer lines and the layout breathes.

import type { HeadlineLines } from "@/types/campaign";

const EM_DASH = "—";
const BLUE_WORD_CAP = 4;

function balanceWords(words: string[]): [string, string] {
  if (words.length === 0) return ["", ""];
  if (words.length === 1) return [words[0]!, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function capBlue(bridgeWords: string[], blueWords: string[]): [string[], string[]] {
  if (blueWords.length <= BLUE_WORD_CAP) return [bridgeWords, blueWords];
  const overflow = blueWords.slice(0, -BLUE_WORD_CAP);
  return [bridgeWords.concat(overflow), blueWords.slice(-BLUE_WORD_CAP)];
}

function splitCaseA(leftText: string, rightText: string): HeadlineLines {
  const [red1, red2] = balanceWords(leftText.split(/\s+/).filter(Boolean));
  const rightWords = rightText.split(/\s+/).filter(Boolean);
  const bridgeCount = Math.min(4, Math.max(1, Math.floor(rightWords.length / 3)));
  let bridgeWords = rightWords.slice(0, bridgeCount);
  let blueWords = rightWords.slice(bridgeCount);
  [bridgeWords, blueWords] = capBlue(bridgeWords, blueWords);
  const bridge = bridgeWords
    .join(" ")
    .replace(new RegExp(`^[${EM_DASH}\\-,. ]+`), "")
    .trim();
  const [blue1, blue2] = balanceWords(blueWords);
  return { red1, red2, bridge, blue1, blue2 };
}

/** Distribute a one-string headline into the 5 card slots. Mirrors the
 * worker's case logic (em-dash split / no-dash heuristic / short input)
 * minus the template-default backfill. */
export function splitHeadline(headline: string | null | undefined): HeadlineLines {
  const stripped = (headline ?? "").trim();
  if (!stripped || stripped.split(/\s+/).length < 2) {
    return { red1: stripped, red2: "", bridge: "", blue1: "", blue2: "" };
  }

  const dashCount = stripped.split(EM_DASH).length - 1;
  if (dashCount >= 1) {
    // Multi-dash: keep the first as the split point, demote the rest.
    const first = stripped.indexOf(EM_DASH);
    const left = stripped.slice(0, first);
    const right = stripped
      .slice(first + 1)
      .split(EM_DASH)
      .join(" ")
      .replace(/ {2,}/g, " ");
    return splitCaseA(left.trim(), right.trim());
  }

  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length < 5) {
    // Short-but-valid: everything goes to the accent lines; the main
    // lines stay empty (NO filler — the layout breathes instead).
    const [red1, red2] = balanceWords(words);
    return { red1, red2, bridge: "", blue1: "", blue2: "" };
  }

  const redEnd = Math.max(1, Math.round(words.length * 0.3));
  const bridgeEnd = Math.max(redEnd + 1, Math.round(words.length * 0.5));
  let bridgeWords = words.slice(redEnd, bridgeEnd);
  let blueWords = words.slice(bridgeEnd);
  [bridgeWords, blueWords] = capBlue(bridgeWords, blueWords);
  const [red1, red2] = balanceWords(words.slice(0, redEnd));
  const [blue1, blue2] = balanceWords(blueWords);
  return { red1, red2, bridge: bridgeWords.join(" "), blue1, blue2 };
}

/** Recompose the slots into the single legacy headline string kept in
 * sync on the card (older renders, AI regeneration context, card lists). */
export function joinHeadlineLines(lines: HeadlineLines): string {
  const left = [lines.red1, lines.red2].map((s) => s.trim()).filter(Boolean).join(" ");
  const right = [lines.bridge, lines.blue1, lines.blue2]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  if (left && right) return `${left} ${EM_DASH} ${right}`;
  return left || right;
}

export function emptyHeadlineLines(): HeadlineLines {
  return { red1: "", red2: "", bridge: "", blue1: "", blue2: "" };
}

export function hasAnyLine(lines: HeadlineLines | null | undefined): boolean {
  if (!lines) return false;
  return Boolean(
    lines.red1.trim() ||
      lines.red2.trim() ||
      lines.bridge.trim() ||
      lines.blue1.trim() ||
      lines.blue2.trim(),
  );
}
