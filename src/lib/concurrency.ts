// Runs `fn` over `items` with at most `limit` in flight at once. Needed
// because Vercel's serverless functions hit "TypeError: fetch failed" across
// the board when a route fires several hundred concurrent outbound fetches
// in one invocation (confirmed: 326 concurrent succeeded, 652 failed
// entirely) — a plain Promise.all over a large array is unsafe here.
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
