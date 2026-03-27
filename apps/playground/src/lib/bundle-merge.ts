import type { CrpBundle } from '@cliproot/protocol'

/**
 * Flattened clip with resolved source info for display.
 */
export interface MergedClip {
  clipHash: string
  id?: string
  documentId?: string
  content?: string
  textHash: string
  sourceRefs: string[]
  selectors?: {
    textQuote?: { exact: string; prefix?: string; suffix?: string }
    textPosition?: { start: number; end: number }
    editorPath?: string
    dom?: {
      provenanceAttribute?: string
      elementId?: string
      cssSelector?: string
      classPath?: string
    }
    mediaTime?: { startMs: number; endMs: number; track?: string; transcriptCueId?: string }
    parentClipHash?: string
  }
  createdByActivityId?: string
  /** Resolved source records for this clip's sourceRefs */
  resolvedSources: ResolvedSource[]
  /** Resolved document for this clip */
  document?: ResolvedDocument
  /** Which bundle key this clip was loaded from */
  bundleKey: string
}

export type SourceType =
  | 'human-authored'
  | 'ai-generated'
  | 'ai-assisted'
  | 'external-quoted'
  | 'unknown'

export interface ResolvedSource {
  id: string
  sourceType: SourceType
  title?: string
  sourceUri?: string
  authorAgentId?: string
  createdAt?: string
}

export interface ResolvedDocument {
  id: string
  uri?: string
  title?: string
}

export interface ResolvedAgent {
  id: string
  agentType: string
  name?: string
  uri?: string
}

export interface ResolvedActivity {
  id: string
  activityType: string
  agentId?: string
  createdAt: string
}

export interface MergedEdge {
  id: string
  childClipHash: string
  parentClipHash: string
  transformationType: string
  agentId?: string
  confidence?: number
  createdAt: string
}

export interface MergedState {
  clips: Map<string, MergedClip>
  edges: MergedEdge[]
  agents: Map<string, ResolvedAgent>
  sources: Map<string, ResolvedSource>
  activities: Map<string, ResolvedActivity>
  documents: Map<string, ResolvedDocument>
}

export function mergeBundles(bundles: Map<string, CrpBundle>): MergedState {
  const clips = new Map<string, MergedClip>()
  const edgeMap = new Map<string, MergedEdge>()
  const agents = new Map<string, ResolvedAgent>()
  const sources = new Map<string, ResolvedSource>()
  const activities = new Map<string, ResolvedActivity>()
  const documents = new Map<string, ResolvedDocument>()

  for (const [bundleKey, bundle] of bundles) {
    // Collect document
    if (bundle.document) {
      const doc = bundle.document
      if (!documents.has(doc.id)) {
        documents.set(doc.id, {
          id: doc.id,
          uri: doc.uri,
          title: doc.title
        })
      }
    }

    // Collect agents
    if (bundle.agents) {
      for (const agent of bundle.agents) {
        if (!agents.has(agent.id)) {
          agents.set(agent.id, {
            id: agent.id,
            agentType: agent.agentType,
            name: agent.name,
            uri: agent.uri
          })
        }
      }
    }

    // Collect sources
    if (bundle.sources) {
      for (const src of bundle.sources) {
        if (!sources.has(src.id)) {
          sources.set(src.id, {
            id: src.id,
            sourceType: src.sourceType as SourceType,
            title: src.title,
            sourceUri: src.sourceUri,
            authorAgentId: src.authorAgentId,
            createdAt: src.createdAt
          })
        }
      }
    }

    // Collect activities
    if (bundle.activities) {
      for (const act of bundle.activities) {
        if (!activities.has(act.id)) {
          activities.set(act.id, {
            id: act.id,
            activityType: act.activityType,
            agentId: act.agentId,
            createdAt: act.createdAt
          })
        }
      }
    }

    // Resolve document for this bundle's clips
    const bundleDoc = bundle.document ? documents.get(bundle.document.id) : undefined

    // Collect clips (deduplicate by clipHash)
    if (bundle.clips) {
      for (const clip of bundle.clips) {
        if (!clips.has(clip.clipHash)) {
          const resolvedSources: ResolvedSource[] = clip.sourceRefs
            .map((ref) => sources.get(ref))
            .filter((s): s is ResolvedSource => s !== undefined)

          clips.set(clip.clipHash, {
            clipHash: clip.clipHash,
            id: clip.id,
            documentId: clip.documentId,
            content: clip.content,
            textHash: clip.textHash,
            sourceRefs: clip.sourceRefs,
            selectors: clip.selectors,
            createdByActivityId: clip.createdByActivityId,
            resolvedSources,
            document: bundleDoc,
            bundleKey
          })
        }
      }
    }

    // Collect derivation edges
    if (bundle.derivationEdges) {
      for (const edge of bundle.derivationEdges) {
        if (!edgeMap.has(edge.id)) {
          edgeMap.set(edge.id, {
            id: edge.id,
            childClipHash: edge.childClipHash,
            parentClipHash: edge.parentClipHash,
            transformationType: edge.transformationType,
            agentId: edge.agentId,
            confidence: edge.confidence,
            createdAt: edge.createdAt
          })
        }
      }
    }
  }

  return {
    clips,
    edges: Array.from(edgeMap.values()),
    agents,
    sources,
    activities,
    documents
  }
}
