import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PeoplePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted-foreground">
          Invite teammates to your organization and manage their roles.
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-10 text-center">
        <UserPlus
          className="mx-auto size-6 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium">Team members are coming soon</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          You&apos;ll be able to add people to your organization, assign
          owner / admin / member roles, and share projects.
        </p>
        <Button className="mt-4" disabled>
          Invite people
        </Button>
      </div>
    </div>
  );
}
