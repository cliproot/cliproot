import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AttributionExtension } from '@cliproot/tiptap'
import { useBundleStore } from '../hooks/useBundleStore'
import { EditorToolbar } from './EditorToolbar'
import { ProvenanceLegend } from './ProvenanceLegend'
import { SlashCommandExtension } from './SlashCommandMenu'
import '../styles/editor.css'

export function ClipEditor() {
  const selectedClipHash = useBundleStore((s) => s.selectedClipHash)
  const selectClip = useBundleStore((s) => s.selectClip)

  const editor = useEditor({
    extensions: [
      StarterKit,
      AttributionExtension.configure({
        onClipsDetected: ({ clipHashes }) => {
          if (clipHashes.length > 0) {
            const store = useBundleStore.getState()
            const firstKnown = clipHashes.find((h) => store.clips.has(h))
            if (firstKnown) {
              store.selectClip(firstKnown)
            }
          }
        },
      }),
      SlashCommandExtension,
    ],
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    content: '<p></p>',
  })

  // Click on attribution span → select clip in sidebar
  useEffect(() => {
    if (!editor) return

    const handler = () => {
      const { $from } = editor.state.selection
      const marks = $from.marks()
      const attrMark = marks.find((m) => m.type.name === 'attribution')
      if (attrMark?.attrs.clipHash) {
        selectClip(attrMark.attrs.clipHash as string)
      }
    }

    editor.on('selectionUpdate', handler)
    return () => { editor.off('selectionUpdate', handler) }
  }, [editor, selectClip])

  // Sidebar clip selection → scroll editor to that mark
  useEffect(() => {
    if (!editor || !selectedClipHash) return

    let targetPos: number | null = null
    editor.state.doc.descendants((node, pos) => {
      if (targetPos !== null) return false
      for (const mark of node.marks) {
        if (mark.type.name === 'attribution' && mark.attrs.clipHash === selectedClipHash) {
          targetPos = pos
          return false
        }
      }
    })

    if (targetPos !== null) {
      editor.chain().setTextSelection(targetPos).scrollIntoView().run()
    }
  }, [selectedClipHash, editor])

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar editor={editor} />
      <ProvenanceLegend />
      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-900/50">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
