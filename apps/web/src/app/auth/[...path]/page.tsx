"use client";

import { use } from "react";
import { AuthView } from "@neondatabase/auth-ui";

// Catch-all auth view (sign-in, sign-up, forgot-password, reset-password, …).
// AuthView picks which form to render from the `pathname` prop — without it,
// it falls back to sign-in regardless of the URL.
export default function AuthPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = use(params);
  const pathname = `/auth/${path.join("/")}`;
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <AuthView pathname={pathname} />
    </div>
  );
}
