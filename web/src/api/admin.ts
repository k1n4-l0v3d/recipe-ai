import type { AdminStats, SessionInfo, User } from './types'

const BASE = '/api/admin'

async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `API error ${res.status}`)
  }
  return res.json()
}

async function adminPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `API error ${res.status}`)
  return data
}

async function adminDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', credentials: 'include' })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `API error ${res.status}`)
  return data
}

export const adminApi = {
  getStats: () => adminGet<AdminStats>('/stats'),
  getUsers: () => adminGet<User[]>('/users'),
  setRole: (userId: string, role: 'user' | 'admin') =>
    adminPut<{ ok: boolean }>(`/users/${userId}/role`, { role }),
  setBan: (userId: string, is_banned: boolean) =>
    adminPut<{ ok: boolean }>(`/users/${userId}/ban`, { is_banned }),
  getSessions: () => adminGet<SessionInfo[]>('/sessions'),
  terminateSession: (sessionId: string) =>
    adminDelete<{ ok: boolean }>(`/sessions/${sessionId}`),
}
