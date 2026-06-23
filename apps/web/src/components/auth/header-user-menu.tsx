"use client";

import { SignedIn, SignedOut, UserButton } from "@neondatabase/auth-ui";
import Link from "next/link";

export function HeaderUserMenu() {
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <Link
          href="/auth/sign-in"
          className="text-sm text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
        >
          Sign in
        </Link>
      </SignedOut>
    </>
  );
}
