/**
 * PIN hashing. The PIN is never stored in plain text: we keep salt + SHA-256.
 * NOTE: a 4-digit PIN is an app-lock, not encryption — it only gates the UI on this device.
 */
export function newSalt(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Insecure context (plain http): weaker non-crypto fallback (cyrb53).
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (const b of data) {
    h1 = Math.imul(h1 ^ b, 2654435761);
    h2 = Math.imul(h2 ^ b, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `weak_${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

/** Lockout after repeated failures: 5 fails → 30s, 10 → 60s, 15 → 120s … capped at 15 min. */
export function lockoutMs(failures: number): number {
  if (failures < 5) return 0;
  return Math.min(15 * 60_000, 30_000 * 2 ** (Math.floor(failures / 5) - 1));
}
