"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const STEPS = [
  {
    num: "01",
    title: "Start from an idea or a transcript",
    desc: "Paste a one-line feature idea or a full refinement-meeting transcript. Loop takes it from there.",
  },
  {
    num: "02",
    title: "It asks clarifying questions",
    desc: "Grounded in your real repo and docs, Loop narrows scope and makes every ambiguity explicit before any code exists.",
  },
  {
    num: "03",
    title: "You edit & approve the spec",
    desc: "Review a structured Feature Spec, edit anything, and approve. The artifact is yours, not a throwaway chat.",
  },
  {
    num: "04",
    title: "Plan generated, PR opened",
    desc: "Loop produces a deterministic implementation plan and opens a reviewable pull request. Always reviewable, never auto-merged.",
  },
];

const monoLabel: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.6875rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--muted-foreground)",
};

export function HowItWorks() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const blocks = Array.from(
      root.querySelectorAll<HTMLElement>("[data-howstep]"),
    );
    const inners = Array.from(
      root.querySelectorAll<HTMLElement>("[data-step-inner]"),
    );
    const nums = Array.from(
      root.querySelectorAll<HTMLElement>("[data-step-num]"),
    );
    const vis = Array.from(root.querySelectorAll<HTMLElement>("[data-vis]"));
    const label = root.querySelector<HTMLElement>("[data-step-label]");
    const bar = root.querySelector<HTMLElement>("[data-step-bar]");

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      [...inners, ...nums, ...vis].forEach((el) => (el.style.transition = "none"));
      if (bar) bar.style.transition = "none";
    }

    let active = -1;
    const apply = (a: number) => {
      if (a === active) return;
      active = a;
      inners.forEach((el, i) => {
        el.style.opacity = i === a ? "1" : "0.4";
        el.style.color = i === a ? "var(--foreground)" : "var(--muted-foreground)";
      });
      nums.forEach((el, i) => {
        const on = i === a;
        el.style.setProperty("background-color", on ? "var(--brand)" : "var(--card)");
        el.style.color = on ? "var(--brand-foreground)" : "var(--muted-foreground)";
        el.style.borderColor = on ? "var(--brand)" : "var(--border)";
      });
      vis.forEach((el, i) => (el.style.opacity = i === a ? "1" : "0"));
      if (label) label.textContent = "0" + (a + 1) + " / 04";
      if (bar) bar.style.width = ((a + 1) / 4) * 100 + "%";
    };
    const compute = () => {
      if (!blocks.length) return;
      const line = window.innerHeight * 0.5;
      let act = 0;
      blocks.forEach((b, i) => {
        if (b.getBoundingClientRect().top <= line) act = i;
      });
      apply(act);
    };

    let tick = 0;
    let t: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const now = Date.now();
      if (tick && now - tick < 60) {
        clearTimeout(t);
        t = setTimeout(compute, 70);
        return;
      }
      tick = now;
      compute();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    compute();

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      clearTimeout(t);
    };
  }, []);

  return (
    <section
      id="how"
      ref={rootRef}
      style={{
        background: "var(--muted)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        paddingBlock: "5rem",
      }}
    >
      <div className="container">
        <div style={{ marginBottom: "52px", maxWidth: "38em" }}>
          <div className="eyebrow" style={{ marginBottom: "14px" }}>
            How it works
          </div>
          <h2
            style={{
              fontSize: "var(--text-h1)",
              letterSpacing: "-0.02em",
              marginBottom: "14px",
            }}
          >
            A linear pipeline, reviewed at every step.
          </h2>
          <p className="lead">
            Four stages turn a fuzzy starting point into reviewable engineering
            work. Nothing advances without you.
          </p>
        </div>

        <div
          className="how-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "0.92fr 1.08fr",
            gap: "64px",
          }}
        >
          <div>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="how-step"
                data-howstep={i}
                style={{
                  minHeight: "60vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  data-step-inner
                  style={{
                    opacity: i === 0 ? 1 : 0.4,
                    color: i === 0 ? "var(--foreground)" : "var(--muted-foreground)",
                    transition: "opacity .45s ease, color .45s ease",
                  }}
                >
                  <div
                    data-step-num
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 500,
                      fontSize: "1rem",
                      marginBottom: "16px",
                      border: i === 0 ? "1px solid var(--brand)" : "1px solid var(--border)",
                      backgroundColor: i === 0 ? "var(--brand)" : "var(--card)",
                      color: i === 0 ? "var(--brand-foreground)" : "var(--muted-foreground)",
                      transition:
                        "background-color .4s ease, color .4s ease, border-color .4s ease",
                    }}
                  >
                    {step.num}
                  </div>
                  <h3
                    style={{
                      fontSize: "var(--text-h2)",
                      letterSpacing: "-0.015em",
                      marginBottom: "10px",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--text-body)",
                      lineHeight: 1.6,
                      maxWidth: "30em",
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="how-sticky" style={{ position: "sticky", top: "16vh" }}>
              <div
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow:
                    "0 1px 2px oklch(0.145 0 0 / 0.04), 0 16px 44px oklch(0.145 0 0 / 0.08)",
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
                  <span
                    data-step-label
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    01 / 04
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "var(--brand)",
                      }}
                    />
                    Loop
                  </span>
                </div>

                <div style={{ position: "relative", height: "432px" }}>
                  {/* Visual 1 — input (idea / transcript) */}
                  <div
                    data-vis
                    style={{
                      position: "absolute",
                      inset: 0,
                      transition: "opacity .5s ease",
                      pointerEvents: "none",
                      opacity: 1,
                    }}
                  >
                    <div
                      style={{
                        padding: "22px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ ...monoLabel, marginBottom: "14px" }}>New feature</div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignSelf: "flex-start",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "3px",
                          gap: "3px",
                          marginBottom: "14px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 12px",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          Idea
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 12px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--brand-subtle)",
                            color: "var(--brand-subtle-foreground)",
                            fontWeight: 500,
                          }}
                        >
                          Transcript
                        </span>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          background: "var(--muted)",
                          padding: "14px",
                          fontSize: "0.8125rem",
                          lineHeight: 1.75,
                          color: "var(--foreground)",
                          overflow: "hidden",
                        }}
                      >
                        <div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>PM</span>
                          {"  "}Can we let people save their filters?
                        </div>
                        <div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>ENG</span>
                          {" "}Per-user, or shared with the team?
                        </div>
                        <div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>PM</span>
                          {"  "}Just per-user for now — and it should survive a refresh.
                        </div>
                        <div style={{ color: "var(--muted-foreground)" }}>…</div>
                      </div>
                      <button
                        className="btn btn-brand"
                        style={{ alignSelf: "flex-start", marginTop: "14px", height: "38px" }}
                      >
                        Start →
                      </button>
                    </div>
                  </div>

                  {/* Visual 2 — clarifying questions */}
                  <div
                    data-vis
                    style={{
                      position: "absolute",
                      inset: 0,
                      transition: "opacity .5s ease",
                      pointerEvents: "none",
                      opacity: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: "22px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "11px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignSelf: "flex-start",
                          alignItems: "center",
                          gap: "6px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          color: "var(--brand-subtle-foreground)",
                          background: "var(--brand-subtle)",
                          border: "1px solid var(--brand-border)",
                          borderRadius: "999px",
                          padding: "3px 10px",
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 1.5a3.2 3.2 0 013.2 3.2v1.1A2.1 2.1 0 0112.7 8v3.8a2.1 2.1 0 01-2.1 2.1H5.4A2.1 2.1 0 013.3 11.8V8a2.1 2.1 0 011.5-1.2V4.7A3.2 3.2 0 018 1.5zm1.9 4.3V4.7a1.9 1.9 0 10-3.8 0v1.1h3.8z"
                            fill="currentColor"
                          />
                        </svg>
                        grounded in issues/filters.ts · docs/views.md
                      </div>
                      <div
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "12px 14px",
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ flex: "none", width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)", marginTop: "6px" }} />
                        <div>
                          <div style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--foreground)", marginBottom: "7px" }}>
                            Should saved views be per-user or shared with the team?
                          </div>
                          <span style={{ display: "inline-flex", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", background: "var(--brand-subtle)", color: "var(--brand-subtle-foreground)", borderRadius: "var(--radius-sm)", padding: "2px 8px" }}>
                            Per-user
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "12px 14px",
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ flex: "none", width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)", marginTop: "6px" }} />
                        <div style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--foreground)" }}>
                          Can a view store sort order too, or only filters?
                        </div>
                      </div>
                      <div
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "12px 14px",
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ flex: "none", width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)", marginTop: "6px" }} />
                        <div style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--foreground)" }}>
                          If a filter&apos;s field is deleted, what should happen to the view?
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual 3 — approved spec */}
                  <div
                    data-vis
                    style={{
                      position: "absolute",
                      inset: 0,
                      transition: "opacity .5s ease",
                      pointerEvents: "none",
                      opacity: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: "22px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <h3 style={{ fontSize: "var(--text-h3)", letterSpacing: "-0.01em" }}>Saved views</h3>
                          <span style={{ border: "1px solid var(--border)", borderRadius: "999px", padding: "1px 9px", fontSize: "0.6875rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                            Existing system
                          </span>
                        </div>
                        <span className="badge" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", padding: "2px 8px" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--brand)" }} />
                          Approved
                        </span>
                      </div>
                      <div>
                        <div style={{ ...monoLabel, marginBottom: "4px" }}>Problem</div>
                        <p style={{ fontSize: "var(--text-small)", lineHeight: 1.5 }}>
                          Users re-apply the same filters every session; there&apos;s no way to name a set and return to it.
                        </p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <div style={{ ...monoLabel, marginBottom: "5px" }}>In scope</div>
                          <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                            <li style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}>Create, rename, delete a view</li>
                            <li style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}>Per-user, scoped to a project</li>
                          </ul>
                        </div>
                        <div>
                          <div style={{ ...monoLabel, marginBottom: "5px" }}>Out of scope</div>
                          <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                            <li style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--muted-foreground)" }}>Shared / team views</li>
                            <li style={{ fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--muted-foreground)" }}>Sidebar pinning</li>
                          </ul>
                        </div>
                      </div>
                      <div>
                        <div style={{ ...monoLabel, marginBottom: "5px" }}>Acceptance criteria</div>
                        <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                          <li style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}>Duplicate names rejected inline</li>
                          <li style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}>Active view reflected in the URL</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Visual 4 — PR */}
                  <div
                    data-vis
                    style={{
                      position: "absolute",
                      inset: 0,
                      transition: "opacity .5s ease",
                      pointerEvents: "none",
                      opacity: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: "22px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>loop/saved-views</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.6875rem", fontWeight: 500, color: "var(--brand-subtle-foreground)", background: "var(--brand-subtle)", border: "1px solid var(--brand-border)", borderRadius: "999px", padding: "2px 10px" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--brand)" }} />
                          Open
                        </span>
                      </div>
                      <h3 style={{ fontSize: "var(--text-h3)", letterSpacing: "-0.01em" }}>Add saved views for the issue list</h3>
                      <div style={monoLabel}>Implementation plan</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                        {[
                          <>
                            Add <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>saved_views</span> table + migration
                          </>,
                          <>Reflect the active view in URL params</>,
                          <>Reject duplicate names with an inline error</>,
                        ].map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flex: "none", marginTop: "2px" }}>
                              <path d="M3.5 8.5l3 3 6-7" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}>{line}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "14px", borderTop: "1px solid var(--border)", paddingTop: "13px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>+124 −8</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>3 files</span>
                        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Awaiting your review</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ height: "3px", background: "var(--border)" }}>
                  <div
                    data-step-bar
                    style={{ height: "100%", background: "var(--brand)", width: "25%", transition: "width .45s ease" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
