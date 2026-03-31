import { useState, useEffect } from 'react'
import { Plus, Search, Building2, MoreVertical, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'

export function Empresas() {
  const { empresas, loadEmpresas } = useAppStore()
  const [search, setSearch] = useState('')
  const [showMenu, setShowMenu] = useState<string | null>(null)

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  const filteredEmpresas = empresas.filter(e => 
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    e.cnpj.includes(search)
  )

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Empresas</h1>
          <p className="section-subtitle">Gerencie seus CNPJs e integrações Omie</p>
        </div>
        
        <Link to="/empresas/nova" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-12"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmpresas.map((empresa) => (
          <div key={empresa.id} className="card-hover group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${empresa.ativa ? 'bg-primary-500/10' : 'bg-dark-800'}
                `}>
                  <Building2 className={`w-6 h-6 ${empresa.ativa ? 'text-primary-400' : 'text-dark-500'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-dark-100">{empresa.nome_fantasia || empresa.nome}</h3>
                  <p className="text-sm text-dark-500">{empresa.cnpj}</p>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(showMenu === empresa.id ? null : empresa.id)}
                  className="p-2 hover:bg-dark-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-dark-400" />
                </button>
                
                {showMenu === empresa.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMenu(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-dark-900 border border-dark-800 rounded-lg shadow-xl z-50 py-1">
                      <Link 
                        to={`/empresas/${empresa.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-dark-300 hover:bg-dark-800"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Link>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-dark-300 hover:bg-dark-800 w-full text-left">
                        {empresa.ativa ? (
                          <><PowerOff className="w-4 h-4" /> Desativar</>
                        ) : (
                          <><Power className="w-4 h-4" /> Ativar</>
                        )}
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-dark-800 w-full text-left">
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-800">
              <div>
                <p className="text-xs text-dark-500">Pedidos</p>
                <p className="text-lg font-semibold text-dark-200">{empresa.total_pedidos}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500">Clientes Sync</p>
                <p className="text-lg font-semibold text-dark-200">{empresa.clientes_sync}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <span className={empresa.ativa ? 'badge-green' : 'badge-gray'}>
                {empresa.ativa ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
