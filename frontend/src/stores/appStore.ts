import { create } from 'zustand'

interface Empresa {
  id: string
  nome: string
  cnpj: string
  nome_fantasia?: string
  ativa: boolean
  total_pedidos?: number
  clientes_sync?: number
}

interface AppState {
  empresas: Empresa[]
  empresaSelecionada: Empresa | null
  sidebarOpen: boolean
  isMobile: boolean
  
  loadEmpresas: () => Promise<void>
  selecionarEmpresa: (empresa: Empresa | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setIsMobile: (isMobile: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  empresas: [],
  empresaSelecionada: null,
  sidebarOpen: true,
  isMobile: false,

  loadEmpresas: async () => {
    try {
      const response = await fetch('/api/empresas')
      if (!response.ok) throw new Error('Erro ao carregar empresas')
      const empresas = await response.json()
      set({ empresas })
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      set({ empresas: [] })
    }
  },

  selecionarEmpresa: (empresa) => {
    set({ empresaSelecionada: empresa })
  },

  toggleSidebar: () => {
    set({ sidebarOpen: !get().sidebarOpen })
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  setIsMobile: (isMobile) => {
    set({ isMobile, sidebarOpen: !isMobile })
  },
}))
