import { create } from 'zustand'

interface Empresa {
  id: string
  nome: string
  cnpj: string
  nome_fantasia?: string
  ativa: boolean
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
    await new Promise(resolve => setTimeout(resolve, 500))
    set({
      empresas: [
        { id: '1', nome: 'Empresa Matriz LTDA', cnpj: '12.345.678/0001-90', nome_fantasia: 'Matriz', ativa: true },
        { id: '2', nome: 'Filial São Paulo LTDA', cnpj: '98.765.432/0001-21', nome_fantasia: 'SP Filial', ativa: true },
        { id: '3', nome: 'Distribuidora Sul LTDA', cnpj: '11.222.333/0001-44', nome_fantasia: 'Sul Distrib', ativa: false },
      ]
    })
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
