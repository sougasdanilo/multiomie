import { Menu, Bell, Search, ChevronDown } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useState } from 'react'

export function Header() {
  const { toggleSidebar, empresaSelecionada, empresas, selecionarEmpresa } = useAppStore()

  const [showEmpresaDropdown, setShowEmpresaDropdown] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-dark-300" />
          </button>
          
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-64 pl-9 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Seletor de Empresa */}
          <div className="relative">
            <button
              onClick={() => setShowEmpresaDropdown(!showEmpresaDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-dark-900 hover:bg-dark-800 border border-dark-800 rounded-lg transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-dark-200 hidden sm:block max-w-[150px] truncate">
                {empresaSelecionada?.nome_fantasia || empresaSelecionada?.nome || 'Todas as empresas'}
              </span>
              <span className="text-sm font-medium text-dark-200 sm:hidden">
                {empresaSelecionada?.nome_fantasia || 'Todas'}
              </span>
              <ChevronDown className="w-4 h-4 text-dark-500" />
            </button>

            {showEmpresaDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowEmpresaDropdown(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-72 bg-dark-900 border border-dark-800 rounded-xl shadow-2xl z-50 animate-fade-in">
                  <div className="p-3 border-b border-dark-800">
                    <p className="text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Selecionar empresa
                    </p>
                  </div>
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
                    <button
                      onClick={() => {
                        selecionarEmpresa(null)
                        setShowEmpresaDropdown(false)
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                        ${!empresaSelecionada ? 'bg-primary-500/10 text-primary-400' : 'hover:bg-dark-800 text-dark-300'}
                      `}
                    >
                      <div className="w-2 h-2 rounded-full bg-dark-500" />
                      <span className="text-sm font-medium">Todas as empresas</span>
                    </button>
                    
                    {empresas.map((empresa) => (
                      <button
                        key={empresa.id}
                        onClick={() => {
                          selecionarEmpresa(empresa)
                          setShowEmpresaDropdown(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                          ${empresaSelecionada?.id === empresa.id ? 'bg-primary-500/10 text-primary-400' : 'hover:bg-dark-800 text-dark-300'}
                        `}
                      >
                        <div className={`w-2 h-2 rounded-full ${empresa.ativa ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{empresa.nome_fantasia || empresa.nome}</p>
                          <p className="text-xs text-dark-500">{empresa.cnpj}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notificações */}
          <button className="relative p-2 hover:bg-dark-800 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-dark-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  )
}
