import type { Category, Recipe, RecipeSummary } from './types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  getCategories: (): Promise<Category[]> =>
    get('/categories'),

  getCategoryRecipes: (categoryId: string): Promise<RecipeSummary[]> =>
    get(`/categories/${categoryId}`),

  getRecipe: (recipeId: string): Promise<Recipe> =>
    get(`/recipes/${encodeURIComponent(recipeId)}`),
}
