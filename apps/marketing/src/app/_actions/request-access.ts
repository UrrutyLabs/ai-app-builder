"use server";

import { z } from "zod";
import { resend } from "@/lib/resend";
import { env } from "@/lib/env";

export type RequestAccessResult =
  | { ok: true }
  | { ok: false; error: string };

const InputSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function requestAccessAction(
  _prev: RequestAccessResult | null,
  formData: FormData,
): Promise<RequestAccessResult> {
  const parsed = InputSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }
  const { email } = parsed.data;

  if (!resend) {
    // No API key wired yet — fail clearly rather than pretending to capture.
    console.warn("[request-access] RESEND_API_KEY not set; dropping", email);
    return { ok: false, error: "Sign-ups aren't live yet. Please try again soon." };
  }

  try {
    // Primary capture: add the email to the waitlist audience in Resend.
    if (env.RESEND_AUDIENCE_ID) {
      const { error } = await resend.contacts.create({
        audienceId: env.RESEND_AUDIENCE_ID,
        email,
        unsubscribed: false,
      });
      // A duplicate email is success from the visitor's perspective.
      if (error && !/already exists/i.test(error.message)) {
        console.error("[request-access] contacts.create failed", error);
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    }

    // Optional internal notification so the team sees requests in real time.
    if (env.RESEND_FROM_EMAIL && env.ACCESS_REQUEST_NOTIFY_EMAIL) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: env.ACCESS_REQUEST_NOTIFY_EMAIL,
        subject: "New Loop access request",
        text: `${email} requested access to the Loop design-partner program.`,
      });
    }

    return { ok: true };
  } catch (err) {
    console.error("[request-access] unexpected error", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
