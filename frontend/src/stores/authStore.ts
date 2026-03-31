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
      user: {
        id: '1',
        nome: 'Administrador',
        email: 'admin@multiomie.com',
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,

      login: async (email, _password) => {
        set({ isLoading: true })
        try {
          await new Promise(resolve => setTimeout(resolve, 1000))
          set({
            user: {
              id: '1',
              nome: 'Administrador',
              email: email,
            },
            token: 'mock-token',
            isAuthenticated: true,
            isLoading: false,
          })
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
