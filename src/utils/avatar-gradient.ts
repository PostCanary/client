// src/utils/avatar-gradient.ts
export const GRADIENTS: [string, string][] = [
  ["#f97316", "#fb7185"], // orange → rose
  ["#a855f7", "#6366f1"], // purple → indigo
  ["#facc15", "#f97316"], // amber → orange
  ["#ec4899", "#a855f7"], // pink → purple
  ["#4f46e5", "#0f172a"], // indigo → near-black
];

export function hashUsernameToGradient(username: string): [string, string] {
  let hash = 0;
  const input = username || "user";
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index]!;
}
