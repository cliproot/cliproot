# Clips Concept Proposal (Span -> Clip)

Date: 2026-03-08  
Status: Analysis and recommendation

## 1) Context

Current `spp-v0.0.1` models attributed excerpts as `spans` with required text selectors:

- `selectors.textPosition` (`start`, `end`)
- `selectors.textQuote` (`exact`, optional `prefix`/`suffix`)
- optional `selectors.editorPath`

This works well for text documents, but your goal is broader:

1. HTML/web page excerpts
2. Media transcript excerpts (and direct media time ranges)

## 2) Recommendation Summary

Recommend adopting **`Clip` as the protocol-level term** for attributed excerpt units, with `Span` retained as a compatibility alias during migration.

Key idea:

- `Clip` = any bounded excerpt from a source artifact (text, HTML, transcript, audio/video timeline)
- location is represented by one or more selectors, chosen by medium

This aligns with the open-protocol direction in your March 7 docs while preserving the PROV mapping (`Clip` remains an `Entity`).

## 3) Terminology and Model Changes

### 3.1 Keep source classification separate from medium

Your current `sourceType` values (`human-authored`, `ai-generated`, etc.) describe authorship/origin class, not technical medium. Keep that.

Add a separate field for medium, e.g.:

- `sourceMedium`: `text-document | html-document | transcript | audio | video | mixed`

This avoids overloading `sourceType`.

### 3.2 Rename `spans` to `clips` (with compatibility window)

Protocol evolution suggestion:

- v0.0.2+: introduce `clips` (new canonical key)
- keep `spans` as accepted input alias for at least one minor version
- ingest rule: if only `spans` is present, normalize to `clips`
- if both are present, require equality (or reject as ambiguous)

Related rename candidates:

- `$defs.span` -> `$defs.clip`
- `generatedSpanRefs` -> `generatedClipRefs` (accept old key as alias)
- HTML hint `data-prov-span-id` -> `data-prov-clip-id` (accept both)

## 4) Selector Strategy by Medium

Use a selector bundle where multiple selectors can coexist; one is primary, others are fallback/re-anchor evidence.

### 4.1 Text/editor documents (existing behavior)

Keep current selectors:

- `textPosition`
- `textQuote`
- optional `editorPath`

### 4.2 HTML pages

#### Preferred explicit embedding

Standardize optional HTML attributes:

- `data-prov-clip-id="<clip_id>"`
- `data-prov-source-ref="<source_id>"`

If present, this is the highest-confidence anchor.

#### Best-effort fallback when attributes are absent

Store layered anchors:

1. `dom.idSelector` (when stable id exists, e.g. `#article-body`)
2. `dom.cssPath` (short stable path; avoid brittle full absolute paths)
3. `dom.classPath` (class-based path with nth-of-type hints)
4. text evidence (`textQuote` + `textPosition` in flattened visible text)

Also store:

- `retrievedAt`
- `sourceUri`
- optional `sourceHash` of normalized HTML snapshot
- `anchorConfidence` (`high|medium|low`)

Resolution order on re-import/re-parse:

1. `data-prov-clip-id`
2. id selector
3. css/class path + quote verification
4. quote-only fuzzy match

### 4.3 Media transcripts and A/V clips

Use dual anchoring where possible:

1. transcript text anchor (quote/position within transcript text)
2. media time anchor (`startMs`, `endMs`)

Recommended selector shape:

- `mediaTime`: `{ "startMs": 12340, "endMs": 18760, "track": "audio|video", "unit": "ms" }`
- optional `transcriptCueId` for cue-level systems

If transcript text shifts across versions, `mediaTime` remains stable. If timing shifts in re-processed media, transcript quote helps re-anchor.

## 5) Standards Alignment

This direction strengthens existing standards alignment from your plan docs:

- PROV-O: `Clip` still maps cleanly to `Entity`
- Web Annotation: continue `TextPositionSelector`/`TextQuoteSelector`, and add selector styles suitable for HTML/media anchoring
- Media fragments style indexing can be represented through the media time selector profile

## 6) Proposed Schema Direction (Conceptual, not final JSON)

```json
{
  "clips": [
    {
      "id": "clip_01",
      "documentId": "doc_01",
      "sourceRefs": ["src_01"],
      "clipKind": "text|html|transcript|media-time",
      "selectors": {
        "textPosition": { "start": 0, "end": 23 },
        "textQuote": { "exact": "Provenance starts here." },
        "editorPath": "0/0/0",
        "dom": {
          "idSelector": "#article-body",
          "cssPath": "main article p:nth-of-type(3)"
        },
        "mediaTime": { "startMs": 12340, "endMs": 18760, "track": "audio" }
      },
      "textHash": "sha256-...",
      "createdByActivityId": "act_01"
    }
  ]
}
```

Notes:

- Not all selector types are required for every clip kind.
- At least one valid selector must exist.
- For text-like clips, keep requiring `textQuote` (as you do now) unless a strong non-text anchor is primary.

## 7) Migration Plan (Low Risk)

1. **Doc/API terminology first**: describe spans as "clips (span alias)".
2. **Schema additive update**: add `clips` and selector extensions without removing old keys.
3. **SDK normalization**: emit canonical `clips` on write; accept `spans` on read.
4. **Clipboard/HTML interoperability**:
   - emit both `data-prov-span-id` and `data-prov-clip-id` during transition
   - parse both on ingest
5. **Deprecation phase**: remove `spans` from canonical examples once ecosystem tools adopt `clips`.

## 8) Risks and Mitigations

Risk: `clip` may be interpreted as only audio/video.  
Mitigation: define `Clip` explicitly as "bounded excerpt of any source medium" in the schema title and README.

Risk: HTML selectors can be brittle over page revisions.  
Mitigation: store multiple anchors plus confidence and verification using quote/hash evidence.

Risk: transcript/media drift across versions.  
Mitigation: dual-anchor design (text + time) and keep source snapshot/version metadata.

## 9) Recommended Immediate Next Step

For the next schema revision, implement an additive `clips` field and `mediaTime`/`dom` selector extensions, while keeping `spans` as an alias for compatibility.
