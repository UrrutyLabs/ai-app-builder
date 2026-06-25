# 0001 — Model the decision, emit the ticket

> **Status:** Accepted · 2026-06-25
> **Scope:** the data-model spine and what "tickets out" means.
> Supersedes the `Initiative → Decisions → Tickets → Changes` spine sketched in the (external) product vision. Referenced by [`roadmap.md`](../roadmap.md) and [`architecture.md`](../architecture.md) §13.

## Context

Today's schema is `Project → Feature → Spec/Plan/PR`, single-player. The open question (roadmap, "the strategic call before Phase 2") was whether to evolve it toward a `Initiative → Decisions → Tickets → Changes` provenance spine, and — underneath that — whether a tool where the whole product+eng team collaborates even needs tickets, especially as work becomes more AI-driven.

A ticket bundles ~6 functions that one tool historically held together: unit of work, **handoff token**, status beacon, planning atom, **addressable reference**, and **record of why**. The real question is which of these Loop absorbs.

- Loop absorbs **handoff** (the spec *is* the shared understanding — no wall to throw over), **status** (a Feature's state is derived from artifacts: spec approved → plan → PR open → merged, not a hand-dragged card), and **record of why** (transcript→decision→spec→plan→PR provenance, richer than a comment thread).
- What survives is the **addressable projection** — inverted. The Feature/Spec is the source; a "ticket" becomes a *compiled output* Loop emits and keeps in sync for systems and people outside it.

**AI-driven shift (why this sharpens rather than weakens the bet).** When an agent turns an approved spec into a PR in minutes, the bottleneck moves from *implementation* to *specification and judgment* — exactly the layer Loop owns. Consequences: the spec stops being a document and becomes a **contract that drives agents**; the human moves from author to **director/verifier**; and two new value props appear that only exist at agent volume — **coherence across many parallel changes**, and **decision memory** as the org-specific context that makes the org's agents better than generic ones.

## Decision

1. **Internal spine:** `Initiative → Decision → Feature (Spec/Plan) → Change`. **Ticket is not an internal node.**
2. **Ticket is a projection** — an emitted, externally-addressable view (Phase 2 "tickets out" = render + sync, an integration boundary, not a workflow Loop owns).
3. **Introduce `Decision` as a first-class, provenanced entity as the Phase 2 seam**, built on the stable `(sourceType, sourceId)` that context docs and transcripts already attach to every retrievable chunk. This is the one piece of the spine worth pulling forward.
4. **Do not build the portfolio/board layer (Initiative planning, assignment) yet** — but model `Initiative`/`Decision` so Loop *can* absorb the board later, when agent volume makes the external board the weak link.

## Consequences

- Phase 2 "Provenance MVP" is concretely **the `Decision` entity**; "tickets out" is reframed as projection/sync, not authorship.
- Tickets-of-record still exist *externally* and legitimately — cross-team deps where the other team isn't in Loop, non-eng work (design/legal/marketing), compliance regimes. Loop **syncs** to those; it doesn't own them.
- Revisit "Loop replaces the board" (needs native Initiative/portfolio view, derived status, ownership) when agent-driven throughput makes the external board the coordination bottleneck.
- The schema bends toward the spine **before** provenance and multiplayer become load-bearing, per the roadmap's "decide deliberately; don't let it default."

## One-liner

**In an AI-driven world, the ticket is a compile target and the decision is the source code — model the decision, emit the ticket.**
