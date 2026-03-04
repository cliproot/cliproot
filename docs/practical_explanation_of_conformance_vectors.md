# Practical Explanation of Conformance Vectors (for Application Developers)

## Why this document exists

If you build apps more than specs, conformance vectors can feel like protocol bureaucracy.

In practice, they are just **shared test fixtures** that let you move faster with less guesswork.

## What a conformance vector is (practical definition)

A conformance vector is a small package that says:

1. "Here is the input payload."
2. "Here is the expected behavior/output."
3. "Here is the reason code/status we should both show."

That is it.

For this repo, each vector is a folder with:
- `case.json` (metadata + runner steps)
- `input/*.json` (payloads your code consumes)
- `expected/*.json` (what your code should produce)
- `notes.md` (human explanation)

## Why you should care as an app developer

Conformance vectors help with the exact problems that slow product teams down:

1. **Reduce hidden ambiguity**
- You do not need to debate every `MUST` sentence while coding.
- You run the vector and see pass/fail.

2. **Protect demo stability**
- Your sample app can run known scenarios repeatedly with deterministic outcomes.
- No "it worked yesterday but not today" from policy edge cases.

3. **Make UI behavior trustworthy**
- Statuses and reason codes in the inspector/event log can be validated against expected outputs.
- This is critical for deny/pending/attribution states.

4. **Speed up cross-component work**
- Frontend, backend, and library code can align against one source of truth.
- You avoid protocol drift between sample app and SDK implementations.

5. **De-risk future rewrites**
- If you later move logic from TS to Rust (or add Python bindings), vectors become your parity safety net.

## What vectors are not

1. Not a certification program (yet).
2. Not a replacement for product UX testing.
3. Not legal enforceability.
4. Not a requirement to implement everything before shipping a demo.

Think of them as **acceptance tests for protocol behavior**.

## How vectors map to your immediate goals

Your stated goal: build libraries and a working sample app quickly to socialize the project.

Vectors support that by giving you:

1. A clear starter backlog for implementation:
- parse envelope
- validate payload
- evaluate policy
- process claim/receipt
- verify idempotency

2. Predefined demo scenarios:
- open accepted
- attribution required
- permission required with/without grant
- private_no_copy deny/notice
- mixed policy + multi-origin + partial pending

3. A visible progress metric:
- "X/Y vectors passing" is better than "seems mostly working."

## Practical development workflow (recommended)

Use vectors as part of your normal implementation loop:

1. Pick one vector from `vectors/v0.3/manifest.json`.
2. Implement only enough library/app logic to satisfy that vector.
3. Surface the resulting status/reason code in your sample app inspector.
4. Run validation tooling:
```bash
python3 tools/conformance/validate_vectors.py --manifest vectors/v0.3/manifest.json
```
5. Move to the next vector.

This is a vertical-slice workflow: protocol primitive + app behavior + UI evidence together.

## Commands for this repo scaffold

```bash
pnpm install
pnpm --filter @provenance/spx-prov-spec test
pnpm --filter sample-app test
pnpm --filter sample-app dev
```

The first two test commands are the machine-checkable proof that `VEC_L1_OPEN_SIGNED_ACCEPTED` passes in this initial implementation slice.

## Suggested implementation order for fastest visible demo

1. `VEC_L1_OPEN_SIGNED_ACCEPTED`
2. `VEC_L1_HTML_FALLBACK_LOW_CONFIDENCE`
3. `VEC_L4_ATTRIBUTION_REQUIRED_ALLOW`
4. `VEC_L4_PERMISSION_REQUIRED_NO_GRANT`
5. `VEC_L4_PERMISSION_REQUIRED_ACTIVE_GRANT`
6. `VEC_L3_REPLAY_CLAIM_IDEMPOTENT`
7. `VEC_L4_MIXED_POLICY_MULTI_ORIGIN`

After these, you can show an end-to-end "real" protocol story in a sample app.

## Minimum "working demo" definition using vectors

A practical MVP demo is credible when:

1. You can copy from Alice and paste into Bob with envelope visibility.
2. Policy outcomes match vector expectations for at least the core 5-7 scenarios above.
3. Event log shows reason codes from expected outcomes.
4. Replay of same `claimId` does not duplicate side effects.

## Bottom line

Conformance vectors are not extra paperwork before real work.
They are a tool to make real work faster, safer, and easier to explain.

For this project, they are the shortest path from abstract protocol text to a convincing, shareable demo.
