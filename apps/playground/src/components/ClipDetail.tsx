import { useBundleStore } from '../hooks/useBundleStore'
import { SourceBadge } from './Badge'

export function ClipDetail() {
  const selectedHash = useBundleStore((s) => s.selectedClipHash)
  const clip = useBundleStore((s) =>
    s.selectedClipHash ? s.clips.get(s.selectedClipHash) : undefined
  )
  const agents = useBundleStore((s) => s.agents)
  const activities = useBundleStore((s) => s.activities)

  if (!clip || !selectedHash) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600">
        <p>Select a clip to view details</p>
      </div>
    )
  }

  const activity = clip.createdByActivityId ? activities.get(clip.createdByActivityId) : undefined
  const activityAgent = activity?.agentId ? agents.get(activity.agentId) : undefined

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      {/* Hash */}
      <Section title="Clip Hash">
        <code className="break-all text-sm text-indigo-300">{clip.clipHash}</code>
        {clip.id && (
          <p className="mt-1 text-sm text-gray-400">
            ID: <code>{clip.id}</code>
          </p>
        )}
      </Section>

      {/* Content */}
      {(clip.content ?? clip.selectors?.textQuote?.exact) && (
        <Section title="Content">
          <blockquote className="border-l-2 border-gray-700 pl-3 text-sm text-gray-200">
            {clip.content ?? clip.selectors?.textQuote?.exact}
          </blockquote>
        </Section>
      )}

      {/* Selectors */}
      {clip.selectors && (
        <Section title="Selectors">
          {clip.selectors.textQuote && (
            <div className="space-y-1 text-sm">
              {clip.selectors.textQuote.prefix && (
                <p className="text-gray-500">
                  prefix:{' '}
                  <span className="text-gray-400">
                    &ldquo;{clip.selectors.textQuote.prefix}&rdquo;
                  </span>
                </p>
              )}
              <p className="text-gray-300">
                exact:{' '}
                <span className="font-medium">&ldquo;{clip.selectors.textQuote.exact}&rdquo;</span>
              </p>
              {clip.selectors.textQuote.suffix && (
                <p className="text-gray-500">
                  suffix:{' '}
                  <span className="text-gray-400">
                    &ldquo;{clip.selectors.textQuote.suffix}&rdquo;
                  </span>
                </p>
              )}
            </div>
          )}
          {clip.selectors.textPosition && (
            <p className="text-sm text-gray-400">
              Position: {clip.selectors.textPosition.start}&ndash;
              {clip.selectors.textPosition.end}
            </p>
          )}
          {clip.selectors.editorPath && (
            <p className="text-sm text-gray-400">
              Editor: <code>{clip.selectors.editorPath}</code>
            </p>
          )}
        </Section>
      )}

      {/* Document */}
      {clip.document && (
        <Section title="Document">
          <div className="rounded bg-gray-800/50 p-2 text-sm space-y-1">
            {clip.document.title && <p className="text-gray-300">{clip.document.title}</p>}
            {clip.document.uri && (
              <a
                href={clip.document.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-blue-400 hover:underline"
              >
                {clip.document.uri}
              </a>
            )}
            <p className="text-gray-600 text-xs">
              ID: <code>{clip.document.id}</code>
            </p>
          </div>
        </Section>
      )}

      {/* Sources */}
      {clip.resolvedSources.length > 0 && (
        <Section title="Sources">
          {clip.resolvedSources.map((src) => {
            const author = src.authorAgentId ? agents.get(src.authorAgentId) : undefined
            return (
              <div key={src.id} className="rounded bg-gray-800/50 p-2 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <SourceBadge type={src.sourceType} />
                  {src.title && <span className="text-gray-300">{src.title}</span>}
                </div>
                {src.sourceUri && (
                  <a
                    href={src.sourceUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-blue-400 hover:underline"
                  >
                    {src.sourceUri}
                  </a>
                )}
                {author && (
                  <p className="text-gray-500">
                    Author: {author.name ?? author.id} ({author.agentType})
                  </p>
                )}
                {src.createdAt && <p className="text-gray-600 text-xs">{src.createdAt}</p>}
              </div>
            )
          })}
        </Section>
      )}

      {/* Activity */}
      {activity && (
        <Section title="Activity">
          <div className="text-sm space-y-1">
            <p className="text-gray-300">
              Type: <code className="text-amber-300">{activity.activityType}</code>
            </p>
            {activityAgent && (
              <p className="text-gray-400">Agent: {activityAgent.name ?? activityAgent.id}</p>
            )}
            <p className="text-gray-600 text-xs">{activity.createdAt}</p>
          </div>
        </Section>
      )}

      {/* Text Hash */}
      <Section title="Text Hash">
        <code className="break-all text-xs text-gray-500">{clip.textHash}</code>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      {children}
    </div>
  )
}
