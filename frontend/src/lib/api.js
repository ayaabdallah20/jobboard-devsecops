// Client HTTP minimal.
// [VULN V5/V3] Le jeton JWT est stocké dans localStorage : il est lisible par
// n'importe quel script injecté (XSS stockée) et donc exfiltrable.
const TOKEN_KEY = 'jobboard_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(path, { method, headers, body: payload })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    let msg = data?.detail || data?.error || `Erreur ${res.status}`
    if (Array.isArray(msg)) msg = msg.map((m) => m.msg).join(', ')
    throw new ApiError(msg, res.status, data)
  }
  return data
}

export async function downloadCv(cvId, filename) {
  const res = await fetch(`/api/cvs/${cvId}/download`, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new ApiError('Téléchargement impossible', res.status)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (filename || `cv-${cvId}`).split('/').pop()
  a.click()
  URL.revokeObjectURL(url)
}
