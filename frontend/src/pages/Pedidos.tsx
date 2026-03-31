import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'

interface Pedido {
  id: string
  numero: string
  cliente: string
  valor_total: number
  status: string
  data: string
  itens: number
  empresa: string
}

const statusConfig = {
  rascunho: { label: 'Rascunho', badge: 'badge-gray' },
  processando: { label: 'Processando', badge: 'badge-blue' },
  concluido: { label: 'Concluído', badge: 'badge-green' },
  faturado: { label: 'Faturado', badge: 'badge-green' },
  cancelado: { label: 'Cancelado', badge: 'badge-red' },
}

export function Pedidos() {
  const { empresaSelecionada } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  useEffect(() => {
    const loadPedidos = async () => {
      try {
        const url = empresaSelecionada 
          ? `/api/pedidos?empresa_id=${empresaSelecionada.id}`
          : '/api/pedidos'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setPedidos(data)
        }
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error)
      }
    }
    loadPedidos()
  }, [empresaSelecionada])

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = p.cliente.toLowerCase().includes(search.toLowerCase()) ||
                         p.numero.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Pedidos</h1>
          <p className="section-subtitle">Gerencie pedidos multi-empresa</p>
        </div>
        
        <Link to="/pedidos/novo" className="btn-primary">
          <Plus className="w-4 h-4" />
          Novo Pedido
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            placeholder="Buscar por nº ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-48"
        >
          <option value="todos">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="processando">Processando</option>
          <option value="concluido">Concluído</option>
          <option value="faturado">Faturado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container overflow-x-auto">
        <table className="table min-w-full">
          <thead>
            <tr>
              <th>Pedido</th>
              <th className="hidden sm:table-cell">Cliente</th>
              <th className="hidden md:table-cell">Data</th>
              <th className="hidden sm:table-cell">Itens</th>
              <th>Valor</th>
              <th>Status</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>
                  <div>
                    <p className="font-medium text-dark-100">{pedido.id}</p>
                    <p className="text-xs text-dark-500 sm:hidden">{pedido.cliente}</p>
                  </div>
                </td>
                <td className="hidden sm:table-cell">{pedido.cliente}</td>
                <td className="hidden md:table-cell">
                  <div className="flex items-center gap-1 text-dark-400">
                    <Calendar className="w-3 h-3" />
                    {pedido.data}
                  </div>
                </td>
                <td className="hidden sm:table-cell">{pedido.itens}</td>
                <td className="font-medium">R$ {pedido.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>
                  <span className={statusConfig[pedido.status as keyof typeof statusConfig].badge}>
                    {statusConfig[pedido.status as keyof typeof statusConfig].label}
                  </span>
                </td>
                <td className="text-right">
                  <Link 
                    to={`/pedidos/${pedido.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                  >
                    Ver
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
