"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Client-side auth instance. Used by `<NeonAuthUIProvider>` to drive the
 * pre-built sign-in / sign-up / user-button UI.
 *
 * `createAuthClient()` with no arguments uses the same-origin `/api/auth/*`
 * route handler we mount in `app/api/auth/[...path]/route.ts`.
 */
// Explicit annotation avoids the deeply inferred Better Auth type leaking the
// pnpm path into d.ts output (TS2742 / TS7056).
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient();
