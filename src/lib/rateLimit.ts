/**
 * Best-effort throttle per key (an IP address): at most `max` hits in `windowMs`.
 *
 * It lives in the memory of one server instance, so it slows a script hammering a
 * form but is not a guarantee across instances. It exists so an open form cannot be
 * used to send unlimited mail to an address the sender chose.
 */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    /** Records a hit and says whether the key is now over its allowance. */
    hit(key: string): boolean {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 5_000) {
        for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return recent.length > max;
    },
  };
}

export function clientIp(request: { headers: { get(name: string): string | null } }): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
