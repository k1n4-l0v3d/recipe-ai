import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cabinetApi } from '../api/cabinet'
import type { Note } from '../api/types'

function NoteCard({ note, onSave, onDelete }: {
  note: Note
  onSave: (content: string) => Promise<void>
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.content)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try { await onSave(text); setEditing(false) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Link to={`/recipe/${note.recipe_id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
          {note.recipe_name}
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              background: 'none', border: '1px solid var(--border-2)', borderRadius: 6,
              padding: '4px 10px', fontSize: 11, color: 'var(--text-3)', cursor: 'pointer', minHeight: 32,
            }}>редактировать</button>
          )}
          <button onClick={onDelete} style={{
            background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
            padding: '4px 10px', fontSize: 11, color: '#ef4444', cursor: 'pointer', minHeight: 32,
          }}>удалить</button>
        </div>
      </div>
      {editing ? (
        <div>
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={4}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical',
              background: 'var(--bg)', border: '1px solid var(--border-2)',
              color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={save} disabled={saving} style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 6, padding: '6px 16px', fontSize: 12, cursor: 'pointer', minHeight: 36,
            }}>
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button onClick={() => { setEditing(false); setText(note.content) }} style={{
              background: 'none', border: '1px solid var(--border-2)', borderRadius: 6,
              padding: '6px 14px', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', minHeight: 36,
            }}>Отмена</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {note.content || <span style={{ color: 'var(--text-3)' }}>Нет текста</span>}
        </div>
      )}
    </div>
  )
}

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cabinetApi.getAllNotes().then(setNotes).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async (recipeId: string, recipeName: string, content: string) => {
    const updated = await cabinetApi.upsertNote(recipeId, recipeName, content)
    setNotes(prev => prev.map(n => n.recipe_id === recipeId ? updated : n))
  }

  const handleDelete = async (recipeId: string) => {
    if (!window.confirm('Удалить заметку?')) return
    await cabinetApi.deleteNote(recipeId)
    setNotes(prev => prev.filter(n => n.recipe_id !== recipeId))
  }

  if (loading) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Загрузка...</div>

  if (notes.length === 0) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
      <div style={{ fontSize: 14 }}>Нет заметок</div>
      <div style={{ fontSize: 12, marginTop: 6 }}>Открой любой рецепт и добавь заметку</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {notes.map(n => (
        <NoteCard
          key={n.recipe_id}
          note={n}
          onSave={(content) => handleSave(n.recipe_id, n.recipe_name, content)}
          onDelete={() => handleDelete(n.recipe_id)}
        />
      ))}
    </div>
  )
}
