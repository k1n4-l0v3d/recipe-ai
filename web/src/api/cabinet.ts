import type { RecipePreview, Note } from './types'

const BASE = '/api'

async function authGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `API error ${res.status}`)
  }
  return res.json()
}

async function authPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `API error ${res.status}`)
  return data
}

async function authPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `API error ${res.status}`)
  return data
}

async function authDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', credentials: 'include' })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `API error ${res.status}`)
  return data
}

export const cabinetApi = {
  // Profile
  updateName: (name: string) =>
    authPut<{ ok: boolean }>('/profile/name', { name }),
  updatePassword: (current_password: string, new_password: string) =>
    authPut<{ ok: boolean }>('/profile/password', { current_password, new_password }),

  // Favorites
  getFavorites: () => authGet<RecipePreview[]>('/favorites'),
  addFavorite: (recipe_id: string, recipe_name: string, image_keyword: string) =>
    authPost<{ ok: boolean }>('/favorites', { recipe_id, recipe_name, image_keyword }),
  removeFavorite: (recipe_id: string) =>
    authDelete<{ ok: boolean }>(`/favorites/${encodeURIComponent(recipe_id)}`),
  checkFavorite: (recipe_id: string) =>
    authGet<{ is_favorite: boolean }>(`/favorites/${encodeURIComponent(recipe_id)}/check`),

  // History
  getHistory: () => authGet<RecipePreview[]>('/history'),
  addHistory: (recipe_id: string, recipe_name: string, image_keyword: string) =>
    authPost<{ ok: boolean }>('/history', { recipe_id, recipe_name, image_keyword }),
  clearHistory: () => authDelete<{ ok: boolean }>('/history'),

  // Notes
  getAllNotes: () => authGet<Note[]>('/notes'),
  getNote: (recipe_id: string) =>
    authGet<{ content: string }>(`/notes/${encodeURIComponent(recipe_id)}`),
  upsertNote: (recipe_id: string, recipe_name: string, content: string) =>
    authPut<Note>(`/notes/${encodeURIComponent(recipe_id)}`, { recipe_name, content }),
  deleteNote: (recipe_id: string) =>
    authDelete<{ ok: boolean }>(`/notes/${encodeURIComponent(recipe_id)}`),
}
