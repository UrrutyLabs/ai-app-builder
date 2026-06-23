// All auth API traffic from the client (sign-in, sign-up, session refresh,
// sign-out, OAuth callbacks) is proxied to Neon Auth through this handler.
// Mount path is fixed: the client expects /api/auth/*.

import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = auth.handler();
