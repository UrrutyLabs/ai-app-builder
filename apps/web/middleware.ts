import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/auth/sign-in" });

// Protect everything except the auth UI pages themselves, the auth API
// handler, Next internals, and static assets.
export const config = {
  matcher: [
    "/((?!auth|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$).*)",
  ],
};
