import type { FeatureSpec } from "@repo/domain/schemas";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="italic text-neutral-400 dark:text-neutral-600">none</p>
    );
  }
  return (
    <ul className="list-inside list-disc space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function SpecView({ spec }: { spec: FeatureSpec }) {
  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{spec.title}</h2>
        <span className="inline-block rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {spec.mode === "greenfield" ? "Greenfield" : "Existing system"}
        </span>
      </div>

      <Section title="Problem">
        <p className="whitespace-pre-wrap">{spec.problem}</p>
      </Section>

      <Section title="Goal">
        <p className="whitespace-pre-wrap">{spec.goal}</p>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="In scope">
          <BulletList items={spec.scope.in} />
        </Section>
        <Section title="Out of scope">
          <BulletList items={spec.scope.out} />
        </Section>
      </div>

      <Section title="Actors">
        <BulletList items={spec.actors} />
      </Section>

      <Section title="User flows">
        <BulletList items={spec.userFlows} />
      </Section>

      <Section title="UI states">
        <BulletList items={spec.uiStates} />
      </Section>

      <Section title="Business rules">
        <BulletList items={spec.businessRules} />
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Data changes">
          <BulletList items={spec.dataChanges} />
        </Section>
        <Section title="API changes">
          <BulletList items={spec.apiChanges} />
        </Section>
      </div>

      <Section title="Acceptance criteria">
        <BulletList items={spec.acceptanceCriteria} />
      </Section>

      <Section title="Assumptions">
        <BulletList items={spec.assumptions} />
      </Section>

      <Section title="Open questions">
        <BulletList items={spec.openQuestions} />
      </Section>
    </div>
  );
}
