# Provenance

Provenance is an open project to make document authorship and reuse traceable at the span level.

It combines:
- A protocol for transferring provenance data during copy/paste and import workflows.
- A Notion-like proof-of-concept editor that preserves and visualizes attribution as content moves across documents.

## Mission

Help people trace information back to its source so they can:
- assess trust and accuracy,
- credit original authors,
- identify AI-generated contributions.

## Why This Matters

Today, copy/paste strips context. Attribution becomes optional, provenance gets lost, and downstream readers cannot reliably verify where claims came from.

This project treats attribution as core infrastructure, not an afterthought.

## What We Are Building

1. **Span-level provenance model**
Track origin and derivation of specific text spans, not just whole documents.

2. **Clipboard interop protocol (draft)**
Define a shared envelope for provenance transfer between cooperating apps, with a source↔destination handshake model.

3. **Cloud-first POC application**
Demonstrate the protocol in practice with identity, persistence, attribution UX, and reuse tracking.

4. **Path to standards alignment**
Design data structures that can map to C2PA concepts at export time while exploring bidirectional reuse acknowledgement.

## Current Status

This repository is currently in **protocol draft + POC planning** stage.

Available today:
- Draft protocol (`spx-prov` v0.1 profile)
- Data model exploration for provenance graph semantics
- C2PA alignment research notes
- Product/architecture plan for a first public POC

Not yet included:
- App scaffold
- Running implementation
- Public API reference

## Repository Guide

- [Protocol Draft](docs/protocol_draft_1.md)
- [Data Structuring](docs/data_structuring.md)
- [POC Plan](docs/draft_plan_1.md)
- [C2PA Research](docs/c2pa_research.md)

## Intended Audience

This README is primarily for:
- potential contributors,
- product/standards stakeholders evaluating adoption,
- teams interested in influencing protocol direction early.

## Near-Term Direction

- Finalize the v0.1 protocol profile and test vectors.
- Build the first cloud POC (editor + attribution graph + handshake events).
- Validate the model through real workflows and interoperability experiments.
- Build credibility toward broader ecosystem participation (including future engagement with the Content Authenticity Initiative).
