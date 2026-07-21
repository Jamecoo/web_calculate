import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default useAuth
