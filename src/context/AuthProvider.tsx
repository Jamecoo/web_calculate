import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'
import { isAdminEmail } from '../constants/admins'
import { AuthContext } from './auth'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  // Bumped after a profile edit; updateProfile() does not fire
  // onAuthStateChanged, so we force the context value to recompute.
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const refreshUser = async () => {
    if (!auth.currentUser) return
    await auth.currentUser.reload()
    setUser(auth.currentUser)
    setNonce((n) => n + 1)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: isAdminEmail(user?.email),
      refreshUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, nonce]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
