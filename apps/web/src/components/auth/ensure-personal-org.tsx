"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { claimMyLegacyProjectsAction } from "@/app/_actions/projects";

/**
 * One-time client bootstrap that guarantees the signed-in user has an active
 * organization. Organizations are managed by Neon Auth (Better Auth org
 * plugin), and org creation is client-only — so this runs from the workspace
 * shell rather than the server.
 *
 * Flow when `enabled` (server reports no active org on the session):
 *   1. If the user already belongs to org(s), activate the first one.
 *   2. Otherwise create a personal org and activate it.
 *   3. Backfill the user's legacy (org-less) projects into the active org.
 *   4. Refresh so server components re-read the now-populated session.
 *
 * Scoping degrades gracefully in the meantime: `scopeWhere` still surfaces the
 * user's legacy projects while `activeOrganizationId` is null, so nothing
 * disappears between sign-in and bootstrap.
 */
export function EnsurePersonalOrg({
  enabled,
  orgName,
  slugSeed,
}: {
  enabled: boolean;
  orgName: string;
  slugSeed: string;
}) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        const existing = await authClient.organization.list();
        const first = existing.data?.[0];

        if (first) {
          await authClient.organization.setActive({
            organizationId: first.id,
          });
        } else {
          const created = await authClient.organization.create({
            name: orgName,
            slug: `personal-${slugSeed}`,
          });
          const orgId = created.data?.id;
          if (orgId) {
            await authClient.organization.setActive({ organizationId: orgId });
          }
        }

        await claimMyLegacyProjectsAction();
        router.refresh();
      } catch (err) {
        // Allow a retry on next mount (e.g. a transient setActive failure).
        ran.current = false;
        console.error("[EnsurePersonalOrg] bootstrap failed:", err);
      }
    })();
  }, [enabled, orgName, slugSeed, router]);

  return null;
}
