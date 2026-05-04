import type { ConsistencyIssue } from "@repo/ai";

/**
 * Events emitted from the PR-creation route handler over a streamed response.
 * The client deserialises these and renders progress accordingly.
 */
export type PrEvent =
  | { type: "step"; label: string }
  | {
      type: "file-start";
      path: string;
      action: "create" | "modify";
      index: number;
      total: number;
    }
  | {
      type: "file-complete";
      path: string;
      verified: boolean;
      verifyError: string | null;
      ms: number;
      repaired: boolean;
    }
  | { type: "committing"; total: number }
  | { type: "consistency-complete"; issueCount: number }
  | {
      type: "pr-opened";
      url: string;
      number: number;
      scaffoldedCount: number;
      generatedCount: number;
      modifiedCount: number;
      unverifiedFiles: string[];
      consistencyIssues: ConsistencyIssue[];
    }
  | { type: "error"; code: string; message: string };

export interface PrSummary {
  prUrl: string;
  prNumber: number;
  scaffoldedCount: number;
  generatedCount: number;
  modifiedCount: number;
  unverifiedFiles: string[];
  consistencyIssues: ConsistencyIssue[];
}
