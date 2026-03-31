import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  nome: string
  email: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          if (!response.ok) throw new Error('Credenciais inválidas')
          const { user, token } = await response.json()
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch {
          set({ isLoading: false })
          throw new Error('Credenciais inválidas')
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      checkAuth: () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false })
        }
      },

      updateUser: (userData) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
