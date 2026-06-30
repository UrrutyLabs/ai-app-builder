import { z } from "zod";

// The marketing site is a separate deployable with its own secrets, so it
// validates its own environment rather than reaching into @repo/domain/env
// (which would couple Resend config into the product app's boot checks).
// Resend vars are optional: the site renders without them; the waitlist
// action degrades to a clear "not configured" error until the key is set.
//
// Treat empty / whitespace-only values as unset. A `.env` with `RESEND_API_KEY=`
// (a common placeholder shape) loads as "", which `.optional()` alone would
// reject — coerce it to undefined so optional really means optional.
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const EnvSchema = z.object({
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  RESEND_AUDIENCE_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  RESEND_FROM_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  ACCESS_REQUEST_NOTIFY_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().optional(),
  ),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:3001"),
  ),
});

export const env = EnvSchema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  ACCESS_REQUEST_NOTIFY_EMAIL: process.env.ACCESS_REQUEST_NOTIFY_EMAIL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
