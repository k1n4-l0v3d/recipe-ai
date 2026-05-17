import { useState, useEffect, useCallback } from 'react'
import { cabinetApi } from '../api/cabinet'
import { useAuth } from '../context/AuthContext'

interface UseNoteReturn {
  content: string
  saving: boolean
  save: (text: string, recipeName: string) => Promise<void>
  remove: () => Promise<void>
}

// useNote manages a single note for a specific recipe.
export function useNote(recipeId: string): UseNoteReturn {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !recipeId) return
    cabinetApi.getNote(recipeId)
      .then(data => setContent(data.content))
      .catch(() => setContent(''))
  }, [user, recipeId])

  const save = useCallback(async (text: string, recipeName: string) => {
    if (!user) return
    setSaving(true)
    try {
      await cabinetApi.upsertNote(recipeId, recipeName, text)
      setContent(text)
    } finally {
      setSaving(false)
    }
  }, [user, recipeId])

  const remove = useCallback(async () => {
    if (!user) return
    await cabinetApi.deleteNote(recipeId)
    setContent('')
  }, [user, recipeId])

  return { content, saving, save, remove }
}
