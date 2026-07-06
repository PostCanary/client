// src/utils/chunkReload.ts
//
// POS-126: We deploy many times a day. Vercel serves /assets/* as immutable,
// so once a deploy rolls, the old hashed chunk files are gone. A tab that's
// been open across a deploy will 404 the very first time it lazily imports a
// route component (e.g. clicking "Designs"), and the click silently does
// nothing — no error surfaces to the user, nothing gets logged. This module
// detects that failure mode and recovers with a one-time hard reload.

/** Patterns thrown by browsers when a dynamic import() 404s or is stale. */
const CHUNK_LOAD_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /chunkloaderror/i,
];

/** True if an error looks like a stale/missing lazy-chunk load failure. */
export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const name = err instanceof Error ? err.name : "";
  return CHUNK_LOAD_ERROR_PATTERNS.some(
    (pattern) => pattern.test(message) || pattern.test(name),
  );
}

const RELOAD_STORAGE_KEY = "pc_chunk_reload_at";
const RELOAD_LOOP_WINDOW_MS = 30_000;

/**
 * Guards against a reload loop: if we already reloaded for a chunk error
 * within the last `windowMs`, refuse to do it again (the problem is
 * something other than a stale chunk, e.g. the deploy itself is broken).
 * Returns true if a reload should proceed (and records the attempt).
 */
export function shouldReloadForChunkError(
  storage: Pick<Storage, "getItem" | "setItem">,
  now: number = Date.now(),
  windowMs: number = RELOAD_LOOP_WINDOW_MS,
): boolean {
  const last = Number(storage.getItem(RELOAD_STORAGE_KEY) ?? 0);
  if (last && now - last < windowMs) {
    return false;
  }
  storage.setItem(RELOAD_STORAGE_KEY, String(now));
  return true;
}
