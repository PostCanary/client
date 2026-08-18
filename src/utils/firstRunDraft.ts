/** In-memory only — survives a FirstRunSetup remount, not a full reload. */
export type FirstRunDraft = {
  industry: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

let draft: FirstRunDraft | null = null;

export function getFirstRunDraft(): FirstRunDraft | null {
  return draft;
}

export function setFirstRunDraft(next: FirstRunDraft | null): void {
  draft = next;
}
