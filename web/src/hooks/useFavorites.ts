import { useState, useEffect, useCallback } from 'react'
import { cabinetApi } from '../api/cabinet'
import type { RecipePreview } from '../api/types'
import { useAuth } from '../context/AuthContext'

interface UseFavoritesReturn {
  favorites: RecipePreview[]
  loading: boolean
  isFavorite: (recipeId: string) => boolean
  toggle: (recipeId: string, recipeName: string, imageKeyword: string) => Promise<void>
  remove: (recipeId: string) => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<RecipePreview[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setFavorites([]); return }
    setLoading(true)
    cabinetApi.getFavorites()
      .then(setFavorites)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const isFavorite = useCallback(
    (recipeId: string) => favorites.some(f => f.recipe_id === recipeId),
    [favorites]
  )

  const toggle = useCallback(async (recipeId: string, recipeName: string, imageKeyword: string) => {
    if (!user) return
    if (isFavorite(recipeId)) {
      await cabinetApi.removeFavorite(recipeId)
      setFavorites(prev => prev.filter(f => f.recipe_id !== recipeId))
    } else {
      await cabinetApi.addFavorite(recipeId, recipeName, imageKeyword)
      setFavorites(prev => [...prev, {
        recipe_id: recipeId,
        recipe_name: recipeName,
        image_keyword: imageKeyword,
        added_at: new Date().toISOString(),
      }])
    }
  }, [user, isFavorite])

  const remove = useCallback(async (recipeId: string) => {
    await cabinetApi.removeFavorite(recipeId)
    setFavorites(prev => prev.filter(f => f.recipe_id !== recipeId))
  }, [])

  return { favorites, loading, isFavorite, toggle, remove }
}
