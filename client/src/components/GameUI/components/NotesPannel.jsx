/**
 * NotesPanel
 * Private notes panel — lets the player jot down observations during the game.
 * Notes are persisted to localStorage via the hook; this component is pure UI.
 *
 * Props:
 *   notes             – string[]
 *   noteInput         – current text in the input field
 *   onNoteInputChange – (value: string) => void
 *   onAddNote         – (e: FormEvent) => void
 *   onDeleteNote      – (index: number) => void
 */
export default function NotesPanel({
  notes,
  noteInput,
  onNoteInputChange,
  onAddNote,
  onDeleteNote,
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 h-full"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-white/30">
        Private notes
      </p>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 min-h-0">
        {notes.length === 0 && (
          <p className="text-xs italic text-white/20">No notes yet…</p>
        )}
        {notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <p className="text-xs text-white/60 flex-1 leading-relaxed">{n}</p>
            <button
              onClick={() => onDeleteNote(i)}
              className="text-white/20 hover:text-red-400/60 transition-colors
                opacity-0 group-hover:opacity-100 flex-shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={onAddNote} className="flex gap-2">
        <input
          type="text"
          value={noteInput}
          onChange={(e) => onNoteInputChange(e.target.value)}
          placeholder="Add note…"
          maxLength={80}
          className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl
            px-3 py-2 text-xs text-white/80 outline-none
            placeholder:text-white/25 focus:border-white/20"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-xl text-xs font-semibold text-white/60
            hover:text-white/90 transition-colors flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Add
        </button>
      </form>
    </div>
  );
}
