import type { Category, Recipe, RecipeSummary } from './types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

// Encode a dish name as URL-safe base64, matching Go's base64.URLEncoding.EncodeToString([]byte(name)).
export function encodeRecipeId(name: string): string {
  const bytes = new TextEncoder().encode(name)
  const binStr = Array.from(bytes, b => String.fromCharCode(b)).join('')
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const api = {
  getCategories: (): Promise<Category[]> =>
    get('/categories'),

  getCategoryRecipes: (categoryId: string, exclude: string[] = []): Promise<RecipeSummary[]> => {
    const params = exclude.length > 0
      ? `?exclude=${exclude.map(encodeURIComponent).join(',')}`
      : ''
    return get(`/categories/${categoryId}${params}`)
  },

  getRecipe: (recipeId: string): Promise<Recipe> =>
    get(`/recipes/${encodeURIComponent(recipeId)}`),
}
