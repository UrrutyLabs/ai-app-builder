import { z } from "zod";

// The marketing site is a separate deployable with its own secrets, so it
// validates its own environment rather than reaching into @repo/domain/env
// (which would couple Resend config into the product app's boot checks).
// Resend vars are optional: the site renders without them; the waitlist
// action degrades to a clear "not configured" error until the key is set.
const EnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_AUDIENCE_ID: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  ACCESS_REQUEST_NOTIFY_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3001"),
});

export const env = EnvSchema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  ACCESS_REQUEST_NOTIFY_EMAIL: process.env.ACCESS_REQUEST_NOTIFY_EMAIL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
