# Contributing

Thanks for your interest in improving Provenance.

## Scope

This repository currently focuses on protocol and research drafts for `spx-prov`.

Good contribution areas:
- protocol clarification and normative language improvements,
- test vectors and conformance scenarios,
- standards mapping analysis,
- implementation notes that improve interoperability and safety.

Conformance assets live at:
- `vectors/v0.3`
- `docs/conformance_vectors.md`
- `docs/conformance_runner_contract.md`

## Before You Open a PR

1. Open an issue first for substantial protocol changes.
2. Describe compatibility impact (`v0.1`/`v0.2`/`v0.3`) and migration expectations.
3. Keep proposals narrowly scoped where possible.

## Pull Request Guidelines

1. Keep changes focused and easy to review.
2. Update related docs when changing behavior or terminology.
3. Add or update test vectors if protocol semantics change.
4. Include a brief risk note for security/privacy-sensitive changes.

Helpful local checks:

```bash
python3 tools/conformance/validate_vectors.py --manifest vectors/v0.3/manifest.json
python3 tools/conformance/generate_matrix.py \
  --reports-root conformance_reports/v0.3 \
  --manifest vectors/v0.3/manifest.json \
  --output docs/conformance_matrix.md
```

## Protocol Change Expectations

For normative changes, include:
- motivation,
- exact sections changed,
- backward compatibility notes,
- conformance impact,
- open questions.

When protocol behavior changes, PRs should include one of:
- corresponding vector updates, or
- explicit rationale for why no vector delta is required.

## Commit and Review

- Prefer small, descriptive commits.
- At least one maintainer approval is required before merge.
- Maintainers may request splitting large PRs.

## Licensing

By contributing, you agree your contributions are licensed under this repository's `LICENSE` file.
