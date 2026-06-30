import { HowItWorks } from "@/app/_components/how-it-works";
import { RequestAccessForm } from "@/app/_components/request-access-form";

const monoTag = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.6875rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "var(--muted-foreground)",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Loop",
  applicationCategory: "DeveloperApplication",
  description:
    "The control plane for product → engineering translation: idea or transcript → spec → implementation plan → reviewable PR, with a human in the loop.",
  operatingSystem: "Web",
};

export default function Page() {
  return (
    <div
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: "var(--font-sans)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in oklab, var(--background) 82%, transparent)",
          backdropFilter: "saturate(140%) blur(10px)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
            paddingBlock: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8.5" stroke="var(--brand)" strokeWidth="2.5" />
              <circle cx="11" cy="11" r="2.6" fill="var(--brand)" />
            </svg>
            <span style={{ fontWeight: 500, fontSize: "1.1875rem", letterSpacing: "-0.02em", color: "var(--foreground)" }}>
              Loop
            </span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <a href="#how" style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--muted-foreground)" }}>
              How it works
            </a>
            <a href="#signin" style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--muted-foreground)" }}>
              Sign in
            </a>
            <a href="#access" className="btn btn-brand" style={{ height: "38px", paddingInline: "16px" }}>
              Request access
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          className="container hero-grid"
          style={{
            paddingBlock: "6rem 4rem",
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "56px",
            alignItems: "center",
          }}
        >
          <div>
            <span className="badge" style={{ marginBottom: "28px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)" }} />
              Pre-launch · Design partner program
            </span>
            <h1 className="display" style={{ fontSize: "var(--text-display)", marginBottom: "20px" }}>
              From a vague feature idea to a spec, a plan, and a real PR.
            </h1>
            <p className="lead" style={{ lineHeight: "var(--leading-body)", marginBottom: "34px", maxWidth: "31em" }}>
              {"Loop is the control plane for product → engineering translation. Drop in an idea or a refinement transcript and it produces a structured spec, a deterministic implementation plan, and a reviewable pull request — with a human approving every step."}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <a href="#access" className="btn btn-brand">
                Request access
              </a>
              <a href="#how" className="btn btn-ghost" style={{ gap: "7px", color: "var(--foreground)" }}>
                See how it works <span style={{ color: "var(--brand)" }}>→</span>
              </a>
            </div>
          </div>

          {/* Hero spec card */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 1px 2px oklch(0.145 0 0 / 0.04), 0 16px 44px oklch(0.145 0 0 / 0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                borderBottom: "1px solid var(--border)",
                background: "var(--muted)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Feature Spec</span>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "2px 6px" }}>v3</span>
                <span className="badge" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", padding: "2px 8px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--brand)" }} />
                  Approved
                </span>
              </div>
            </div>

            <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ fontSize: "var(--text-h3)", letterSpacing: "-0.015em" }}>Saved views for the issue list</h3>
                <span style={{ flex: "none", border: "1px solid var(--border)", borderRadius: "999px", padding: "1px 9px", fontSize: "0.6875rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                  Existing system
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={monoTag}>Problem</div>
                <p style={{ fontSize: "var(--text-small)", lineHeight: 1.5, color: "var(--foreground)" }}>
                  Users re-apply the same filters every session; there&apos;s no way to name a filter set and return to it.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={monoTag}>In scope</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <li style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--foreground)" }}>Create, rename, delete a view</li>
                    <li style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--foreground)" }}>Per-user, scoped to a project</li>
                  </ul>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={monoTag}>Out of scope</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <li style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--muted-foreground)" }}>Shared / team views</li>
                    <li style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--muted-foreground)" }}>Pinning to the sidebar</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={monoTag}>
                  Acceptance criteria <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--muted-foreground)" }}>{"· diff v2 → v3"}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", lineHeight: 1.5, border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: "8px", padding: "5px 11px", background: "var(--muted)", color: "var(--muted-foreground)" }}>
                    <span style={{ flex: "none", opacity: 0.6 }}>−</span>
                    <span style={{ textDecoration: "line-through" }}>User can save a view.</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", padding: "5px 11px", background: "var(--brand-subtle)", color: "var(--brand-subtle-foreground)", borderLeft: "2px solid var(--brand)" }}>
                    <span style={{ flex: "none" }}>+</span>
                    <span>Saving a duplicate name is rejected inline, never silently overwritten.</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", padding: "5px 11px", color: "var(--foreground)" }}>
                    <span style={{ flex: "none", opacity: 0.3 }}>{" "}</span>
                    <span>Switching a view updates the URL so it&apos;s shareable.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={monoTag}>Open questions</div>
                <p style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--foreground)" }}>
                  Should an empty filter set be savable as a view?
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--primary)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--brand-subtle)", opacity: 0.9 }}>→ PR</span>
              <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--primary-foreground)" }}>Implementation plan ready</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "color-mix(in oklab, var(--primary-foreground) 60%, transparent)" }}>#1284 · awaiting review</span>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="container" style={{ paddingBottom: "6rem" }}>
          <div
            className="problem-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "0.8fr 1.2fr",
              gap: "48px",
              alignItems: "start",
              borderTop: "1px solid var(--border)",
              paddingTop: "56px",
            }}
          >
            <div className="eyebrow">The problem</div>
            <p style={{ fontSize: "1.6875rem", fontWeight: 400, lineHeight: 1.42, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
              Between a product conversation and shippable engineering work, requirements stay vague and context gets lost.{" "}
              <span className="muted">Ambiguity surfaces mid-build, decisions go undocumented, and teams pay for it in rework.</span>
            </p>
          </div>
        </section>

        <HowItWorks />

        {/* Why it's different */}
        <section className="container" style={{ paddingBlock: "5.5rem" }}>
          <div className="eyebrow" style={{ marginBottom: "14px" }}>
            Why it&apos;s different
          </div>
          <h2 style={{ fontSize: "var(--text-h1)", letterSpacing: "-0.02em", marginBottom: "44px" }}>
            Built for the handoff, not the hype.
          </h2>
          <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "36px" }}>
            {[
              {
                t: "Grounded in your codebase",
                d: "Loop indexes your real repo and docs and retrieves them into every step. Not ChatGPT with a form on top.",
              },
              {
                t: "Human in the loop",
                d: "Every artifact is reviewed and approved before it advances. PRs are always reviewable — never auto-merged.",
              },
              {
                t: "Structured, versioned artifacts",
                d: "Specs are versioned with diffs you can track and revisit — not throwaway chat history.",
              },
            ].map((c) => (
              <div key={c.t} style={{ borderTop: "1px solid var(--border)", paddingTop: "22px" }}>
                <h3 style={{ fontSize: "var(--text-h3)", letterSpacing: "-0.01em", marginBottom: "11px" }}>{c.t}</h3>
                <p style={{ fontSize: "var(--text-small)", lineHeight: 1.6, color: "var(--muted-foreground)" }}>{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Design partner CTA + form */}
        <section id="access" className="container" style={{ paddingBottom: "5rem" }}>
          <div
            className="access-grid"
            style={{
              background: "var(--primary)",
              borderRadius: "var(--radius-xl)",
              padding: "56px",
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: "48px",
              alignItems: "center",
            }}
          >
            <div>
              <div className="eyebrow" style={{ color: "var(--brand-subtle)", marginBottom: "16px" }}>
                Design partner program
              </div>
              <h2 style={{ fontSize: "var(--text-h1)", lineHeight: 1.14, letterSpacing: "-0.02em", color: "var(--primary-foreground)", marginBottom: "16px" }}>
                {"We're working with a small number of product + engineering teams."}
              </h2>
              <p style={{ fontSize: "var(--text-body)", lineHeight: 1.6, color: "color-mix(in oklab, var(--primary-foreground) 65%, transparent)" }}>
                An ~8–12 week program to shape Loop with teams that feel this problem daily. Free during the program. Limited spots.
              </p>
            </div>
            <RequestAccessForm />
          </div>
        </section>

        {/* FAQ */}
        <section className="container" style={{ paddingBottom: "6rem" }}>
          <div
            className="faq-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "0.5fr 1.5fr",
              gap: "48px",
              borderTop: "1px solid var(--border)",
              paddingTop: "56px",
            }}
          >
            <h2 style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.01em" }}>Questions</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                {
                  q: "What does Loop actually do?",
                  a: "It turns a feature idea or refinement transcript into a structured spec, an implementation plan, and a reviewable PR. It's a control plane — not an IDE or an autonomous agent.",
                },
                {
                  q: "Is my code and data safe?",
                  a: "Loop indexes your repo and docs only to ground its retrieval. A human approves every step, and PRs are never auto-merged.",
                },
                {
                  q: "Who is it for?",
                  a: "Product and engineering teams who want to narrow requirements and reduce rework before code gets written.",
                },
                {
                  q: "Is it free right now?",
                  a: "Yes — Loop is free for design partners during the ~8–12 week program.",
                },
              ].map((item, i, arr) => (
                <div
                  key={item.q}
                  style={{
                    paddingTop: i === 0 ? 0 : "20px",
                    paddingBottom: i === arr.length - 1 ? 0 : "20px",
                    borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: "var(--text-body)", marginBottom: "7px" }}>{item.q}</div>
                  <p style={{ fontSize: "var(--text-small)", lineHeight: 1.6, color: "var(--muted-foreground)" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Final CTA */}
      <section style={{ background: "var(--brand)", paddingBlock: "4.5rem", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ fontSize: "var(--text-h1)", letterSpacing: "-0.02em", color: "var(--brand-foreground)", marginBottom: "26px" }}>
            Bring clarity to the handoff.
          </h2>
          <a href="#access" className="btn" style={{ backgroundColor: "var(--background)", color: "var(--brand)" }}>
            Request access
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="container"
        style={{ paddingBlock: "48px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "32px" }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "10px" }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8.5" stroke="var(--brand)" strokeWidth="2.5" />
              <circle cx="11" cy="11" r="2.6" fill="var(--brand)" />
            </svg>
            <span style={{ fontWeight: 500, fontSize: "1.0625rem", letterSpacing: "-0.02em", color: "var(--foreground)" }}>Loop</span>
          </div>
          <p style={{ fontSize: "var(--text-small)", color: "var(--muted-foreground)", marginBottom: "4px" }}>
            The control plane for product → engineering translation.
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>© 2026 Loop. All rights reserved.</p>
        </div>
        <div style={{ display: "flex", gap: "40px", fontSize: "var(--text-small)" }}>
          <a href="mailto:partners@loop.dev" style={{ color: "var(--muted-foreground)" }}>partners@loop.dev</a>
          <a href="#privacy" style={{ color: "var(--muted-foreground)" }}>Privacy</a>
          <a href="#terms" style={{ color: "var(--muted-foreground)" }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
