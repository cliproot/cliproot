# Rust Core vs Simpler Stack, and OSS Sample App Alternatives

Date: 2026-03-02

## Context

This memo evaluates two devil's-advocate concerns:

1. Whether a Rust-first core library introduces unnecessary complexity if database I/O is likely the primary bottleneck for long revision history and many attributed spans.
2. Whether a scoped open-source sample app should remain public even while a larger cloud product is private/commercial.

References considered:

- `docs/protocol_draft_3.md`
- `docs/libraries_plan.md`
- `README.md`
- `docs/c2pa_research.md`

## 1) Is Rust More Complexity Than Necessary?

## Short answer

- Your concern is valid: for many end-to-end document workflows, **database access and indexing strategy are likely the dominant latency/cost driver**, not raw CPU.
- Rust still has value, but mostly for **consistency across runtimes, deterministic behavior, and cryptographic correctness**, not because it is guaranteed to solve the primary performance bottleneck.

## Where time is typically spent (for long histories + many spans)

For realistic cloud usage, latency is usually dominated by:

1. Read/write amplification across document versions, span tables, and provenance edges.
2. Query planning/index misses for lineage/reuse traversal.
3. Network roundtrips and callback/handshake operations.
4. Serialization and API orchestration overhead.

CPU-heavy protocol operations (canonicalization, hashing, signature verification, policy evaluation) are usually smaller than database/query costs, unless you batch huge numbers of segments per request.

## Rust-specific benefits (beyond raw speed)

1. Single canonical behavior for Node + Python + future languages.
2. Reduced protocol drift risk when conformance requirements get stricter.
3. Strong safety properties around parser/validator/crypto code.
4. Better long-term fit if high-volume verification pipelines appear later.

## Rust-specific costs (current stage)

1. Build/release/toolchain complexity (`cargo`, `napi-rs`, `pyo3`, wheels, native binaries).
2. Higher contributor barrier versus TypeScript-only implementation.
3. CI complexity and slower iteration in early protocol churn.
4. More failure modes at language-boundary packaging time than pure TS.

## Decision framing

If the top near-term goal is **adoption + fast spec iteration**, a pure Rust-first mandate may be heavier than necessary.

If the top near-term goal is **cross-language deterministic correctness from day one**, Rust core is justified despite complexity.

## Practical alternatives

## Option A: Rust-first canonical core (current plan)

- Pros: strongest cross-language consistency early.
- Cons: highest initial complexity and release overhead.
- Best when: correctness parity across Node/Python is non-negotiable immediately.

## Option B: TypeScript-first canonical core + schema/vectors

- Pros: fastest early iteration and easiest contributor onboarding.
- Cons: later Python parity requires reimplementation or FFI pivot; drift risk rises.
- Best when: first consumers are mostly JS/TS and you need speed of iteration.

## Option C: Phased hybrid (recommended)

1. Start with canonical `spec` + vectors + TypeScript reference evaluator/validator.
2. Keep Rust core as a **parallel track** initially limited to hot/correctness-critical paths.
3. Promote Rust to canonical only once:
   - vectors stabilize,
   - two-language parity is required,
   - and packaging automation is mature.

This keeps early momentum high while preserving a credible path to canonical native core later.

## Recommendation on Rust question

Adopt **Option C (phased hybrid)**.

- This accepts your bottleneck argument (DB/query design likely dominates early),
- avoids committing full organizational overhead to Rust wrappers too early,
- and still preserves the path to a Rust canonical core when protocol churn decreases.

## 2) Should There Be an Open-Source Sample App?

## Short answer

Yes. A scoped OSS sample app is strategically useful even with a private commercial cloud app.

## Why an OSS sample app helps

1. Proves real implementation feasibility of protocol + libraries.
2. Dramatically improves developer adoption versus docs-only SDKs.
3. Serves as executable conformance reference for clipboard and policy UX behavior.
4. Reduces "spec ambiguity" by showing end-to-end decisions in code.
5. Helps external contributors test integrations locally.

## Risks and how to contain them

1. Risk: giving away too much product differentiation.
   - Control: keep sample intentionally minimal and single-tenant.
2. Risk: maintenance burden.
   - Control: define strict scope and compatibility policy.
3. Risk: confusion between sample and commercial offering.
   - Control: explicit README positioning and feature matrix.

## Recommended OSS sample app scope

Include:

1. Single-user or small-team demo auth mode.
2. Editor with attribution marks and inspector UI.
3. Clipboard import/export with `application/x-provenance+json` + HTML fallback.
4. Basic claim/receipt handshake simulation or simple callback endpoint.
5. Minimal provenance graph view for a document.

Exclude (keep private/commercial):

1. Multi-tenant org controls, billing, quotas.
2. Proprietary analytics and growth loops.
3. Advanced enterprise integrations/connectors.
4. Production-grade abuse controls/ops tooling.
5. Proprietary policy heuristics/risk scoring.

## Suggested positioning

- `provenance-sample-app` is a **reference implementation** for protocol integration.
- Commercial cloud app is the **managed product** with advanced operational and enterprise capabilities.

## 3) Combined Alternatives Matrix

| Alternative | Rust Strategy | Sample App Strategy | Adoption Speed | Complexity | Long-Term Correctness |
|---|---|---|---|---|---|
| A | Rust-first canonical | No OSS app | Medium | High | High |
| B | TS-first only | OSS sample app | High | Low-Medium | Medium |
| C (recommended) | Phased hybrid | OSS sample app (scoped) | High | Medium | High |

## 4) Recommended Path (Next 2 Milestones)

## Milestone 1 (immediate)

1. Publish `spec` package + conformance vectors.
2. Ship TS reference implementation for validation + policy evaluation.
3. Launch scoped OSS sample app using TS reference path.
4. Benchmark with realistic history/span datasets to verify actual bottlenecks.

## Milestone 2 (after initial adoption feedback)

1. Implement Rust core for selected hot/correctness-critical modules.
2. Run vector parity tests TS vs Rust in CI.
3. Decide promotion to Rust-canonical based on measured gains and maintenance cost.

## 5) Concrete Open Questions Before Locking Direction

1. What target workload should represent "large history + many spans" for benchmarking (document size, revision count, span density)?
2. What p95/p99 latency budget do you want for paste/import/validate and for lineage queries?
3. Is Python SDK availability required in first external release, or can it follow after TS adoption?
4. Do you want the OSS sample app to run entirely local/dev-only, or include deployable reference infra?
5. Should the sample app include real signature verification by default, or stub mode plus optional strict mode?

## Bottom line

- Treat Rust as a **strategic correctness/performance option**, not an unconditional first move.
- Treat an OSS sample app as a **high-leverage adoption artifact** if tightly scoped.
- The best risk-balanced path is a **phased hybrid library strategy plus a clearly bounded reference app**.
