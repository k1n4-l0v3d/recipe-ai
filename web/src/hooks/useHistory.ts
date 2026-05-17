import { useCallback } from 'react'
import { cabinetApi } from '../api/cabinet'
import { useAuth } from '../context/AuthContext'

// useHistory provides a fire-and-forget function to record recipe views.
export function useHistory() {
  const { user } = useAuth()

  const addToHistory = useCallback((recipeId: string, recipeName: string, imageKeyword: string) => {
    if (!user) return
    cabinetApi.addHistory(recipeId, recipeName, imageKeyword).catch(console.error)
  }, [user])

  return { addToHistory }
}
