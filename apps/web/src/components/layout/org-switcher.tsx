"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Organization picker. Lists the user's orgs, switches the active one, and
 * creates new orgs — all via the Neon Auth org plugin. `orgName` is the
 * server-rendered active-org name, used as the label until the client hooks
 * hydrate so the header doesn't flash.
 */
export function OrgSwitcher({ orgName }: { orgName: string }) {
  const router = useRouter();
  const { data: orgs } = authClient.useListOrganizations();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeId = activeOrg?.id ?? null;
  const label = activeOrg?.name ?? orgName;
  const list = orgs ?? [];

  const switchTo = (organizationId: string) => {
    if (organizationId === activeId) return;
    startTransition(async () => {
      const { error } = await authClient.organization.setActive({
        organizationId,
      });
      if (error) {
        toast.error(error.message ?? "Could not switch organization");
        return;
      }
      router.refresh();
    });
  };

  const onCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      // Suffix keeps the slug globally unique on first try; it's editable later
      // in Settings. Math.random is fine here (client component, not a workflow).
      const slug = `${slugify(trimmed) || "org"}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const created = await authClient.organization.create({
        name: trimmed,
        slug,
      });
      if (created.error || !created.data) {
        toast.error(created.error?.message ?? "Could not create organization");
        return;
      }
      await authClient.organization.setActive({
        organizationId: created.data.id,
      });
      setCreating(false);
      setName("");
      toast.success(`Created ${trimmed}`);
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <span className="max-w-[140px] truncate font-medium">{label}</span>
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              Free
            </Badge>
            <ChevronsUpDown className="size-4 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {list.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchTo(org.id)}
              disabled={isPending}
            >
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === activeId ? (
                <Check className="size-4" aria-hidden="true" />
              ) : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-org-name">Name</Label>
            <Input
              id="new-org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCreate();
                }
              }}
              placeholder="Acme Inc."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreating(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={isPending || !name.trim()}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
