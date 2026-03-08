# CRP JSON Schema Package (`v0.0.1`)

This folder contains the initial JSON Schema package for **ClipRoot Protocol (CRP)**.

## Scope

This `v0.0.1` package intentionally stays minimal and aligns to terminology from `research/high_level_plan_march_7_2026.md`:

- `Agent`
- `Entity` (represented here through `Clip` + `SourceRecord`)
- `Activity`
- `Clip`
- `SourceRecord`
- `ReuseEvent`

## Files

- `crp-v0.0.1.schema.json`: canonical schema for CRP `0.0.1`
- `examples/crp-v0.0.1.document.example.json`: valid sample `document` bundle

## Notes

- Top-level bundle types: `document | clipboard | reuse-event`
- Required clip selectors: `textPosition` and `textQuote`
- Optional clip selectors for broader media support: `dom` and `mediaTime`
- Required clip hash format: `sha256-<base64url>`
- Legacy ingest support (`startOffset`, `endOffset`, `provenanceId`) is intentionally not first-class in this schema package and should be normalized by ingestion adapters.
