# `@cliproot/protocol`

`@cliproot/protocol` provides schema-backed validation and generated types for ClipRoot Protocol `v0.0.3`.

It includes:

- CRP bundle validation against the canonical `v0.0.3` schema
- generated TypeScript types derived from that schema
- deterministic hashing helpers for clip text
- example fixtures that cover projects, artifacts, prompt-aware activities, and session artifacts

## Install

```bash
pnpm add @cliproot/protocol
```

## Usage

```ts
import { createTextHash, parseBundle, validateBundle } from '@cliproot/protocol'

const result = validateBundle(payload)
if (!result.ok) {
  console.error(result.errors)
}

const parsed = parseBundle(payload)
const textHash = createTextHash('Provenance starts here.')
```

## Schema Source Of Truth

Canonical schema artifacts live in:

- `../../schema/crp-v0.0.3.schema.json`
- `../../schema/examples/crp-v0.0.3.document.example.json`

The canonical example includes:

- project-scoped clips
- generalized provenance edges
- markdown and session artifacts
- activities with `prompt`, `parameters`, and `endedAt`
- clip-artifact links such as `attached_to`

Use:

```bash
pnpm --filter @cliproot/protocol schema:sync
pnpm --filter @cliproot/protocol schema:check
```
