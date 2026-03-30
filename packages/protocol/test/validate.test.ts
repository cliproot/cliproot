import { readFileSync } from 'node:fs'

import {
  ACTIVITY_TYPES,
  AGENT_TYPES,
  BUNDLE_TYPES,
  CrpValidationError,
  EDGE_TYPES,
  parseBundle,
  CRP_V0_0_3_SCHEMA,
  SOURCE_TYPES,
  TRANSFORMATION_TYPES,
  validateBundle
} from '../src/index.js'
import type { CrpBundle } from '../src/types.js'

function readFixture(): CrpBundle {
  const fixtureUrl = new URL('../schema/examples/crp-v0.0.3.document.example.json', import.meta.url)
  return JSON.parse(readFileSync(fixtureUrl, 'utf8')) as CrpBundle
}

describe('validateBundle', () => {
  it('validates the canonical example fixture', () => {
    const result = validateBundle(readFixture())
    expect(result.ok).toBe(true)
  })

  it('accepts a minimal valid bundle', () => {
    const result = validateBundle({
      protocolVersion: '0.0.3',
      bundleType: 'document',
      createdAt: '2026-03-07T20:30:00Z'
    })

    expect(result.ok).toBe(true)
  })

  it('rejects missing required top-level fields', () => {
    const result = validateBundle({
      bundleType: 'document',
      createdAt: '2026-03-07T20:30:00Z'
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((issue) => issue.instancePath === '/protocolVersion')).toBe(true)
  })

  it('rejects malformed projectId and artifact fields', () => {
    const bundle = readFixture()
    const firstClip = bundle.clips?.[0]
    const result = validateBundle({
      ...bundle,
      clips: firstClip
        ? [
            {
              ...firstClip,
              projectId: 'bad project id'
            }
          ]
        : [],
      artifacts: [
        {
          artifactHash: 'not-a-hash',
          artifactType: 'markdown',
          fileName: 'plan.md',
          mimeType: 'text/markdown',
          byteSize: 10
        }
      ]
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((issue) => issue.instancePath.endsWith('/projectId'))).toBe(true)
    expect(result.errors.some((issue) => issue.instancePath.endsWith('/artifactHash'))).toBe(true)
  })

  it('accepts selectors with parentClipHash', () => {
    const bundle = readFixture()
    const firstClip = bundle.clips?.[0]
    if (!firstClip) throw new Error('Fixture missing first clip.')

    const result = validateBundle({
      ...bundle,
      clips: [
        {
          ...firstClip,
          selectors: {
            parentClipHash: 'sha256-ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
          }
        }
      ]
    })

    expect(result.ok).toBe(true)
  })

  it('accepts valid generalized edges', () => {
    const bundle = readFixture()
    expect(bundle.edges).toBeDefined()
    expect(bundle.edges!.length).toBeGreaterThan(0)

    const result = validateBundle(bundle)
    expect(result.ok).toBe(true)
  })

  it('rejects edges missing required fields', () => {
    const bundle = readFixture()
    const result = validateBundle({
      ...bundle,
      edges: [
        {
          id: 'edge_bad',
          edgeType: 'wasDerivedFrom'
        }
      ]
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((issue) => issue.instancePath.includes('subjectRef'))).toBe(true)
    expect(result.errors.some((issue) => issue.instancePath.includes('objectRef'))).toBe(true)
    expect(result.errors.some((issue) => issue.instancePath.includes('createdAt'))).toBe(true)
  })

  it('rejects invalid edge and transformation types', () => {
    const bundle = readFixture()
    const result = validateBundle({
      ...bundle,
      edges: [
        {
          id: 'edge_bad',
          edgeType: 'not-an-edge-type',
          subjectRef: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          objectRef: 'sha256-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          transformationType: 'invalid-type',
          createdAt: '2026-03-07T20:05:00Z'
        }
      ]
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((issue) => issue.instancePath.endsWith('/edgeType'))).toBe(true)
    expect(result.errors.some((issue) => issue.instancePath.endsWith('/transformationType'))).toBe(
      true
    )
  })

  it('accepts extended activity fields', () => {
    const bundle = readFixture()
    const result = validateBundle({
      ...bundle,
      activities: [
        {
          id: 'act_review',
          projectId: 'proj_auth_refactor',
          activityType: 'review',
          prompt: 'Review the plan for missing edge cases.',
          parameters: { model: 'claude-opus' },
          createdAt: '2026-03-07T20:01:00Z',
          endedAt: '2026-03-07T20:02:00Z'
        }
      ]
    })

    expect(result.ok).toBe(true)
  })

  it('accepts session artifacts attached to clips', () => {
    const bundle = readFixture()
    expect(bundle.artifacts?.some((artifact) => artifact.artifactType === 'session')).toBe(true)
    expect(bundle.clipArtifactRefs?.some((link) => link.relationship === 'attached_to')).toBe(
      true
    )

    const result = validateBundle(bundle)
    expect(result.ok).toBe(true)
  })

  it('accepts optional registry declaration', () => {
    const bundle = readFixture()
    const result = validateBundle({
      ...bundle,
      registry: {
        uri: 'https://registry.cliproot.org',
        bundleId: 'bundle_doc_01'
      }
    })

    expect(result.ok).toBe(true)
  })
})

describe('parseBundle', () => {
  it('returns typed bundle for valid inputs', () => {
    const parsed = parseBundle(readFixture())
    expect(parsed.bundleType).toBe('document')
  })

  it('throws CrpValidationError with issue details for invalid input', () => {
    const invalid = {
      protocolVersion: '0.0.3',
      bundleType: 'invalid',
      createdAt: 'bad-date'
    }

    const validateResult = validateBundle(invalid)
    expect(validateResult.ok).toBe(false)
    if (validateResult.ok) return

    try {
      parseBundle(invalid)
      throw new Error('Expected parseBundle to throw.')
    } catch (error) {
      expect(error).toBeInstanceOf(CrpValidationError)
      const typed = error as CrpValidationError
      expect(typed.issues).toEqual(validateResult.errors)
    }
  })
})

describe('schema enum constants', () => {
  it('matches schema enum definitions', () => {
    expect(BUNDLE_TYPES).toEqual(CRP_V0_0_3_SCHEMA.properties.bundleType.enum)
    expect(SOURCE_TYPES).toEqual(CRP_V0_0_3_SCHEMA.$defs.sourceRecord.properties.sourceType.enum)
    expect(AGENT_TYPES).toEqual(CRP_V0_0_3_SCHEMA.$defs.agent.properties.agentType.enum)
    expect(ACTIVITY_TYPES).toEqual(CRP_V0_0_3_SCHEMA.$defs.activity.properties.activityType.enum)
    expect(EDGE_TYPES).toEqual(CRP_V0_0_3_SCHEMA.$defs.edge.properties.edgeType.enum)
    expect(TRANSFORMATION_TYPES).toEqual(
      CRP_V0_0_3_SCHEMA.$defs.edge.properties.transformationType.enum
    )
  })
})
