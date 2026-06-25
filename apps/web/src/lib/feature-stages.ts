export type StageKey = "idea" | "qa" | "spec" | "plan" | "pr";
export type StageState = "done" | "active" | "locked";

export interface StageInfo {
  key: StageKey;
  label: string;
  state: StageState;
}

/**
 * Single source of truth for a feature's stage states — used by both the hub
 * overview and the per-page stage stepper, so they always agree. Derives from
 * the raw nullable fields (a field is set once its stage has produced output),
 * so no JSON parsing is needed.
 */
export function deriveStageStates(feature: {
  answers: unknown;
  spec: unknown;
  plan: unknown;
  approvedAt: Date | null;
  prUrl: string | null;
}): StageInfo[] {
  const answered = feature.answers != null;
  const hasSpec = feature.spec != null;
  const approved = feature.approvedAt != null;
  const hasPlan = feature.plan != null;
  const prOpened = feature.prUrl != null;

  return [
    { key: "idea", label: "Idea", state: "done" },
    { key: "qa", label: "Q&A", state: answered ? "done" : "active" },
    {
      key: "spec",
      label: "Spec",
      state: !answered ? "locked" : hasSpec ? "done" : "active",
    },
    {
      key: "plan",
      label: "Plan",
      state: !approved ? "locked" : hasPlan ? "done" : "active",
    },
    {
      key: "pr",
      label: "PR",
      state: !hasPlan ? "locked" : prOpened ? "done" : "active",
    },
  ];
}
