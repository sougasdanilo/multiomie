import { useState } from 'react'
import { Plus, Search, Package, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'

const mockProdutos = [
  { id: '1', codigo: 'SKU-001', descricao: 'Notebook Dell i7', ncm: '8471.30.12', unidade: 'UN', preco_base: '5.500,00', estoque: { matriz: 15, sp: 8, sul: 0 } },
  { id: '2', codigo: 'SKU-002', descricao: 'Mouse Logitech MX', ncm: '8471.60.10', unidade: 'UN', preco_base: '450,00', estoque: { matriz: 45, sp: 32, sul: 12 } },
  { id: '3', codigo: 'SKU-003', descricao: 'Teclado Mecânico RGB', ncm: '8471.60.10', unidade: 'UN', preco_base: '650,00', estoque: { matriz: 3, sp: 5, sul: 2 } },
  { id: '4', codigo: 'SKU-004', descricao: 'Monitor 27" 4K', ncm: '8528.52.00', unidade: 'UN', preco_base: '2.800,00', estoque: { matriz: 8, sp: 3, sul: 1 } },
]

export function Produtos() {
  const { empresaSelecionada: _ } = useAppStore()
  const [search, setSearch] = useState('')

  const filteredProdutos = mockProdutos.filter(p => 
    p.descricao.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Produtos</h1>
          <p className="section-subtitle">Catálogo com estoque multi-empresa</p>
        </div>
        
        <Link to="/produtos/novo" className="btn-primary">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          placeholder="Buscar por código ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-12"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProdutos.map((produto) => (
          <div key={produto.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-dark-100 text-sm">{produto.codigo}</p>
                  <p className="text-xs text-dark-500">NCM: {produto.ncm}</p>
                </div>
              </div>
              <Link 
                to={`/produtos/${produto.id}`}
                className="p-2 hover:bg-dark-800 rounded-lg"
              >
                <Edit className="w-4 h-4 text-dark-400" />
              </Link>
            </div>
            
            <p className="text-dark-200 mb-4 line-clamp-2">{produto.descricao}</p>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 bg-dark-800/50 rounded text-center">
                <p className="text-xs text-dark-500">Matriz</p>
                <p className={`text-sm font-semibold ${produto.estoque.matriz < 5 ? 'text-red-400' : 'text-dark-200'}`}>
                  {produto.estoque.matriz}
                </p>
              </div>
              <div className="p-2 bg-dark-800/50 rounded text-center">
                <p className="text-xs text-dark-500">SP</p>
                <p className={`text-sm font-semibold ${produto.estoque.sp < 5 ? 'text-red-400' : 'text-dark-200'}`}>
                  {produto.estoque.sp}
                </p>
              </div>
              <div className="p-2 bg-dark-800/50 rounded text-center">
                <p className="text-xs text-dark-500">Sul</p>
                <p className={`text-sm font-semibold ${produto.estoque.sul < 5 ? 'text-red-400' : 'text-dark-200'}`}>
                  {produto.estoque.sul}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-dark-800">
              <span className="text-sm text-dark-500">{produto.unidade}</span>
              <span className="font-semibold text-dark-100">R$ {produto.preco_base}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
