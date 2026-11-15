import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setReady(true); return }
    try { setUser(await api('/api/auth/me')) } catch { setToken(null); setUser(null) }
    setReady(true)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = async (email, password) => {
    const r = await api('/api/auth/login', { method: 'POST', body: { email, password } })
    setToken(r.access_token)
    setUser(r.user)
    return r.user
  }

  const register = async (payload) => {
    const r = await api('/api/auth/register', { method: 'POST', body: payload })
    setToken(r.access_token)
    setUser(r.user)
    return r.user
  }

  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    setToken(null)
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, ready, login, register, logout, refresh, setUser }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)

export const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'recruteur' ? '/recruteur' : '/candidat')
