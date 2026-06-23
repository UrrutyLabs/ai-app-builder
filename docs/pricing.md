# Pricing — strategy & working notes

> Status: **deliberately deferred.** `Vision.md` §11 lists pricing shape as an open question to defer until design partners reveal willingness to pay. This doc is not a price list — it's the strategy for *this* stage and the instrumentation that will let us set a price with confidence later. Update it as design-partner signal comes in.

## The principle

At the design-partner stage, **pricing is a learning problem, not a revenue problem.** With fewer than five partners, any revenue is rounding error, but the friction of charging is not: the moment you invoice, the relationship flips from "help us figure this out together" to "you're a vendor who'd better perform," and you lose the candid feedback that is the entire point of a design partner.

So we don't charge for the product at this stage. We charge in a different currency — weekly feedback, real usage on a real refinement, and permission to be a named reference. That's worth more than a few hundred dollars a month right now, because it produces the two things money can't: proof and data.

The output of this stage is **not a price.** It's the three inputs needed to set one with confidence: our cost to serve (margin), the value metric customers actually pay against, and who the buyer is.

## What makes Loop's pricing unusual

Unlike typical SaaS, Loop has real, variable COGS. Every spec burns Sonnet, every plan burns Opus, code generation runs Sonnet in a typecheck-retry loop (failed attempts cost *more* tokens), and indexing burns OpenAI embeddings. A heavy team on a flat per-seat plan could be unprofitable. This single fact shapes everything below and rules out the cleanest pricing options at both extremes.

## This stage: the design-partner program

Free, but **structured** so it still answers the pricing question:

- **Time-box it explicitly** — "free during the design-partner program, ~8–12 weeks." This filters for partners serious enough to commit and builds a natural pricing conversation into the end of the window, rather than an awkward "surprise, we charge now" later. They know from day one it's a paid product they're getting early.
- **Capture a willingness-to-pay anchor before the window closes, asked the right way.** "Would you pay for this?" gets a polite lie. Better: "If this saved your team a day per sprint, what would that be worth?" and "What budget would this come from — tooling, headcount, something else?" The budget-line question is the sharpest signal: it reveals both the buyer and how they'll justify the spend. The strongest signal of all is whether a partner converts to a paid pilot when free ends.
- **Pick partners who can actually buy.** A champion who loves it but can't sign a PO gives a false reading. Aim for partners where the engaged person is a head of product or engineering — which also feeds the "which buyer leads" question (`Vision.md` §11).
- **Manage the one real risk: free → paid conversion friction.** The time-box and the early willingness-to-pay anchor are exactly what defuse it.

## Instrumentation — the actual build for this stage

This is the load-bearing work. Model calls already route centrally through `packages/ai/src/models.ts`, so wrap them to record real cost and usage. Without this, the eventual price is a guess; with it, it's arithmetic. **Implementation brief: [`docs/specs/usage-instrumentation.md`](specs/usage-instrumentation.md).**

**Cost to serve (per feature, per step):**

- model, input tokens, output tokens, retry count, and dollar cost for every LLM call
- attribute each call to a `featureId` and step (`questions` / `spec` / `plan` / `generate-file` / `extract-from-transcript`)
- watch the `generate`-mode PR especially: the Opus plan + Sonnet codegen typecheck-retry loop is where cost varies wildly, and **retries are the hidden multiplier**

**Usage shape (per team, per week):**

- features created; specs / plans generated; PRs by mode (doc-only vs stubs vs generate)
- step re-runs (re-running discards downstream artifacts and re-spends tokens)

**Value signal (the ROI story that justifies a price):**

- which features reach a merged PR
- time from idea → merged

At the end of the window this lets us say: *"an active team costs ~$Y/month to serve and ships Z features through Loop; at price P the margin is M."* That de-risks all three hard questions at once.

## Path to commercial pricing (for later, not now)

Captured so the instrumentation targets the right model. Decide for real only once design-partner data is in.

**Recommended shape: a seat-anchored hybrid.** Per-seat is the headline — it tells the right story (Loop is a collaboration tool where PM and engineer work one artifact) and it's how buyers budget. Wrap it with a generous included quota of AI feature-runs per seat plus a fair-use cap, and meter the one genuinely expensive, genuinely discrete action — *generate code → PR* — separately if margins demand. That action is both the biggest COGS and the most legible "wow," so it's the natural usage dimension without nickel-and-diming the spec/plan work that should feel free-flowing.

**Why not pure usage / per-PR:** it taxes exactly the behavior we want to encourage. Every feature run deepens the context lineage that *is* the moat; metering the moat-builder makes teams ration it. It also creates bill-anxiety and procurement friction in the mid-market we start in.

**Why not pure per-seat:** the variable-COGS problem above, and it under-monetizes the highest-value, highest-cost action.

**Tiering, later:** a team plan (per active contributor, with included run quota + fair-use cap) and an enterprise tier (SSO, org-level prompt customization — already on the roadmap — security/retention controls) on a per-seat floor. Role-differentiated seats aren't worth the complexity early.

## Dependency: which buyer leads

Pricing is downstream of the other open `Vision.md` §11 question. If heads of **product** buy, seats-for-collaborators with land-and-expand into engineering fits cleanly. If heads of **engineering** buy, they may push toward per-repo or usage-based. Don't fully resolve pricing before resolving this — and that, too, is a design-partner question.

## Open questions to resolve with data

- What does an active team actually cost us per month to serve? (instrumentation answers this)
- What's the value metric customers will pay against — features shipped, rework avoided, cycle-time reduced?
- Who is the buyer, and what budget line do they spend from?
- Does the `generate`-PR action need its own usage meter, or does a fair-use cap suffice?
