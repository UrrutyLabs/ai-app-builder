import type {
  AffectedArea,
  ImplementationPlan,
  ImplementationStep,
} from "@repo/domain/schemas";

const ACTION_BADGE: Record<"create" | "modify" | "delete", string> = {
  create: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  modify: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const AREA_LABEL: Record<AffectedArea, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  infrastructure: "Infrastructure",
  docs: "Docs",
  tests: "Tests",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function groupStepsByArea(
  steps: ImplementationStep[],
): Array<{ area: AffectedArea; steps: ImplementationStep[] }> {
  const groups = new Map<AffectedArea, ImplementationStep[]>();
  for (const step of steps) {
    const list = groups.get(step.area) ?? [];
    list.push(step);
    groups.set(step.area, list);
  }
  return Array.from(groups.entries()).map(([area, steps]) => ({ area, steps }));
}

export function PlanView({ plan }: { plan: ImplementationPlan }) {
  const grouped = groupStepsByArea(plan.steps);

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <Section title="Summary">
        <p className="whitespace-pre-wrap">{plan.summary}</p>
      </Section>

      <Section title="Affected areas">
        <div className="flex flex-wrap gap-2">
          {plan.affectedAreas.map((area) => (
            <span
              key={area}
              className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground"
            >
              {AREA_LABEL[area]}
            </span>
          ))}
        </div>
      </Section>

      <Section title="File changes">
        {plan.fileChanges.length === 0 ? (
          <p className="italic text-muted-foreground dark:text-muted-foreground">none</p>
        ) : (
          <ul className="space-y-2">
            {plan.fileChanges.map((fc, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-md border px-3 py-2"
              >
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-xs uppercase ${ACTION_BADGE[fc.action]}`}
                >
                  {fc.action}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-foreground/80">
                    {fc.path}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {fc.summary}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Steps">
        <div className="space-y-5">
          {grouped.map(({ area, steps }) => (
            <div key={area} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                {AREA_LABEL[area]}
              </h4>
              <ol className="space-y-2 ml-4 list-decimal">
                {steps.map((s, i) => (
                  <li key={`${area}-${i}`}>
                    <div className="font-medium">{s.title}</div>
                    <div className="text-muted-foreground">
                      {s.description}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Test plan">
        <ul className="list-inside list-disc space-y-1">
          {plan.testPlan.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Section>

      <Section title="Risks &amp; edge cases">
        <ul className="space-y-3">
          {plan.risks.map((r, i) => (
            <li
              key={i}
              className="rounded-md border p-3"
            >
              <div className="font-medium">{r.description}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-muted-foreground">
                  Mitigation:
                </span>{" "}
                {r.mitigation}
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
