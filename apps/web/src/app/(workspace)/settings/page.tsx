import { getCurrentUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

const MODELS = [
  { step: "Questions", model: "Claude Haiku 4.5" },
  { step: "Spec", model: "Claude Sonnet 4.6" },
  { step: "Plan", model: "Claude Opus 4.7" },
  { step: "Code", model: "Claude Sonnet 4.6" },
];

export default async function OrgSettingsPage() {
  const user = await getCurrentUser();
  const orgName = user?.name?.trim() || "Personal";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Organization configuration. Most of this becomes editable when teams
          and orgs ship.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Organization
        </h2>
        <div className="space-y-2">
          <Label htmlFor="org-name">Name</Label>
          <Input id="org-name" defaultValue={orgName} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-slug">Slug</Label>
          <Input
            id="org-slug"
            defaultValue={orgName.toLowerCase().replace(/\s+/g, "-")}
            disabled
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Default models
        </h2>
        <div className="rounded-lg border bg-card divide-y">
          {MODELS.map((m) => (
            <div
              key={m.step}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">{m.step}</span>
              <span className="font-mono text-xs">{m.model}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Per-org model overrides are coming soon.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-destructive">
          Danger zone
        </h2>
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 p-4">
          <div className="text-sm">
            <div className="font-medium">Delete organization</div>
            <div className="text-muted-foreground">
              Permanently remove the org and all its projects.
            </div>
          </div>
          <Button variant="outline" disabled>
            Delete
          </Button>
        </div>
      </section>
    </div>
  );
}
