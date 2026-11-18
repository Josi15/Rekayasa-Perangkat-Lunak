import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService, onUnauthorized } from '../services'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Mock: sesi dibaca sinkron dari localStorage (demo). API: sesi = cookie Sanctum; peran & status dipulihkan dari GET /auth/me
// (bukan dari localStorage), jadi `loading` true sampai /auth/me selesai.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.currentUser())
  const [loading, setLoading] = useState(() => !!authService.needsRestore)
  const settle = useCallback(async (u) => { if (u && authService.afterAuth) await authService.afterAuth(u); return u }, [])

  useEffect(() => {
    if (!authService.needsRestore) return undefined
    let active = true
    authService.restore().then(settle).then((u) => active && setUser(u)).catch(() => active && setUser(null)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [settle])

  // 401 dari API mana pun = sesi berakhir → kosongkan user; ProtectedRoute mengarahkan ke /login.
  useEffect(() => onUnauthorized(() => setUser(null)), [])

  const login = useCallback(async (creds) => {
    const u = await settle(await authService.login(creds))
    setUser(u)
    return u
  }, [settle])
  const updateUser = useCallback((patch) => {
    if (authService.needsRestore) setUser((u) => ({ ...u, ...patch }))
    else setUser(authService.updateSession(patch))
  }, [])
  const logout = useCallback(async () => {
    try { await authService.logout() } catch { /* sesi sisi server mungkin sudah berakhir */ }
    setUser(null)
  }, [])
  return <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>{children}</AuthContext.Provider>
}
