// src/lib/nonceStore.ts
const nonces = new Set<string>();

export function addNonce(n: string) {
  nonces.add(n);
}

export function consumeNonce(n: string): boolean {
  if (!nonces.has(n)) return false;
  nonces.delete(n);
  return true;
}
