"use client";

import { useActionState } from "react";
import {
  requestAccessAction,
  type RequestAccessResult,
} from "@/app/_actions/request-access";

export function RequestAccessForm() {
  const [state, formAction, pending] = useActionState<
    RequestAccessResult | null,
    FormData
  >(requestAccessAction, null);

  if (state?.ok) {
    return (
      <div
        style={{
          background: "var(--card)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
        }}
      >
        <div
          style={{
            fontSize: "var(--text-body)",
            fontWeight: 500,
            color: "var(--foreground)",
            marginBottom: "6px",
          }}
        >
          Thanks — we&apos;ll be in touch.
        </div>
        <p
          style={{
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            color: "var(--muted-foreground)",
          }}
        >
          We&apos;re reaching out to a small set of teams. Keep an eye on your
          inbox.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      style={{
        background: "var(--card)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
      }}
    >
      <label
        htmlFor="email"
        style={{
          display: "block",
          fontSize: "var(--text-small)",
          fontWeight: 500,
          color: "var(--foreground)",
          marginBottom: "8px",
        }}
      >
        Request access
      </label>
      <input
        id="email"
        name="email"
        className="input"
        type="email"
        required
        placeholder="you@company.com"
        aria-invalid={state?.ok === false}
        style={{ marginBottom: "12px" }}
      />
      <button
        type="submit"
        className="btn btn-brand"
        style={{ width: "100%" }}
        disabled={pending}
      >
        {pending ? "Sending…" : "Request access"}
      </button>
      {state?.ok === false && (
        <p
          role="alert"
          style={{
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            color: "var(--destructive, oklch(0.577 0.245 27.325))",
            marginTop: "10px",
          }}
        >
          {state.error}
        </p>
      )}
      <p
        style={{
          fontSize: "0.8125rem",
          lineHeight: 1.5,
          color: "var(--muted-foreground)",
          marginTop: "12px",
        }}
      >
        We&apos;ll reach out to a small set of teams. No spam, no obligation.
      </p>
    </form>
  );
}
