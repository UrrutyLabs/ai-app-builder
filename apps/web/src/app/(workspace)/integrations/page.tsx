import {
  FileText,
  GitBranch,
  MessageSquare,
  PenTool,
  SquareKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CONNECTORS = [
  {
    name: "GitHub",
    icon: GitBranch,
    desc: "Index a repo and open pull requests.",
    status: "Connect a repo from a project",
  },
  {
    name: "Linear",
    icon: SquareKanban,
    desc: "Push approved specs as issues with acceptance criteria.",
    status: "Coming soon",
  },
  {
    name: "Jira",
    icon: SquareKanban,
    desc: "Push approved specs as tickets.",
    status: "Coming soon",
  },
  {
    name: "Slack",
    icon: MessageSquare,
    desc: "Notify a channel on spec approval and PR merge.",
    status: "Coming soon",
  },
  {
    name: "Figma",
    icon: PenTool,
    desc: "Pull design intent into user flows and UI states.",
    status: "Coming soon",
  },
  {
    name: "Notion",
    icon: FileText,
    desc: "Import a PRD page as project context.",
    status: "Coming soon",
  },
] as const;

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect the tools your team already uses. GitHub works today (per
          project); the rest are on the roadmap.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONNECTORS.map((c) => (
          <div key={c.name} className="space-y-2 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <c.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">{c.name}</span>
            </div>
            <p className="min-h-[2.5rem] text-sm text-muted-foreground">
              {c.desc}
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              {c.status}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
