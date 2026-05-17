import type { Category, Recipe, RecipeSummary, User } from './types'

const BASE = '/api'

// All requests include credentials so the session cookie is sent automatically.
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`)
  return data
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

export const authApi = {
  register: (name: string, email: string, password: string) =>
    post<{ user: User }>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    post<{ user: User }>('/auth/login', { email, password }),

  logout: () =>
    post<{ ok: boolean }>('/auth/logout', {}),

  me: async (): Promise<User | null> => {
    try {
      const data = await get<{ user: User }>('/auth/me')
      return data.user
    } catch {
      return null
    }
  },
}
