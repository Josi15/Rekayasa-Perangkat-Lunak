import { createContext, useCallback, useMemo, useState } from 'react'
import { authService } from '../services/index.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSession())

  const login = useCallback(async (identifier, password, opts) => {
    const u = await authService.login(identifier, password, opts)
    setUser(u)
    return u
  }, [])
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateUser = useCallback((patch) => setUser(authService.updateSession(patch)), [])

  const value = useMemo(() => ({ user, login, logout, updateUser }), [user, login, logout, updateUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
