import "server-only";
import { Resend } from "resend";
import { env } from "./env";

// Single Resend client, or null when no API key is configured. Callers must
// handle null so the build and local dev work without secrets.
export const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;
