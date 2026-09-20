/** Stable, collision-safe IDs (no Math.random). */
export function newId(prefix: string): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `${prefix}_${c.randomUUID()}`;
  const bytes = c.getRandomValues(new Uint8Array(16));
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
