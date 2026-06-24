"use client";

import { use } from "react";
import { AccountView } from "@neondatabase/auth-ui";

export const dynamic = "force-dynamic";

// Catch-all account view (profile/settings, security, sessions, 2FA, …). Like
// AuthView, AccountView renders the right cards + nav from the pathname. Paths
// resolve under the provider's account basePath (`/account`), which this route
// serves.
export default function AccountPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = use(params);
  const pathname =
    path && path.length > 0 ? `/account/${path.join("/")}` : "/account";

  return (
    <div className="mx-auto max-w-4xl">
      <AccountView pathname={pathname} />
    </div>
  );
}
