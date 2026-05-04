import { createOctokit } from "@repo/repos";

export interface PrStatus {
  state: "open" | "merged" | "closed";
  mergedAt: string | null;
  closedAt: string | null;
  /** Internal: when this entry was fetched. */
  fetchedAt: number;
}

interface PrRef {
  owner: string;
  repo: string;
  number: number;
}

/**
 * Parse a github.com PR URL into owner/repo/number. Returns null if the URL
 * doesn't match (we never throw — the caller treats null as "unknown").
 */
export function parsePrUrl(url: string): PrRef | null {
  const m = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/.exec(url);
  if (!m) return null;
  const [, owner, repo, num] = m;
  if (!owner || !repo || !num) return null;
  return { owner, repo, number: Number.parseInt(num, 10) };
}

const TTL_MS = 5_000;
// Module-level cache. Survives across server-component renders within a single
// process. Keyed by prUrl. We invalidate via TTL only — close enough for v0.5.
const cache = new Map<string, PrStatus>();

/**
 * Fetch the current open/merged/closed status of a PR. Cached for 5s in
 * memory to avoid hammering GitHub when the page is re-rendered.
 *
 * Returns null on any failure (parse error, network error, 404, auth) — the
 * caller renders "unknown" rather than blowing up the page.
 */
export async function fetchPrStatus(
  prUrl: string,
  token: string,
): Promise<PrStatus | null> {
  const cached = cache.get(prUrl);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;

  const ref = parsePrUrl(prUrl);
  if (!ref) return null;

  try {
    const oct = createOctokit(token);
    const { data } = await oct.pulls.get({
      owner: ref.owner,
      repo: ref.repo,
      pull_number: ref.number,
    });

    const merged = data.merged ?? false;
    const state: PrStatus["state"] = merged
      ? "merged"
      : data.state === "closed"
        ? "closed"
        : "open";

    const status: PrStatus = {
      state,
      mergedAt: data.merged_at ?? null,
      closedAt:
        state === "closed" && !merged ? (data.closed_at ?? null) : null,
      fetchedAt: Date.now(),
    };
    cache.set(prUrl, status);
    return status;
  } catch (err) {
    console.error("[fetchPrStatus] failed:", err);
    return null;
  }
}
