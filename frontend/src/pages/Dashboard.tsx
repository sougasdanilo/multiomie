import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  ArrowRight,
  Clock
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface RecentOrder {
  id: string
  cliente: string
  valor: string
  status: string
  empresa: string
  tempo: string
}

interface Activity {
  tipo: string
  descricao: string
  detalhe: string
  tempo: string
  icon: React.ComponentType<{ className?: string }>
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'concluido':
      return <span className="badge-green">Concluído</span>
    case 'processando':
      return <span className="badge-blue">Processando</span>
    case 'pendente':
      return <span className="badge-yellow">Pendente</span>
    case 'faturando':
      return <span className="badge-blue pulse-soft">Faturando</span>
    default:
      return <span className="badge-gray">{status}</span>
  }
}

export function Dashboard() {
  const { empresaSelecionada } = useAppStore()
  const [timeRange, setTimeRange] = useState('hoje')
  const [stats, setStats] = useState({
    vendasHoje: 0,
    pedidosHoje: 0,
    novosClientes: 0,
    produtosBaixoEstoque: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const url = empresaSelecionada
          ? `/api/dashboard?empresa_id=${empresaSelecionada.id}`
          : '/api/dashboard'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setRecentOrders(data.recentOrders || [])
          setActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      }
    }
    loadDashboardData()
  }, [empresaSelecionada, timeRange])

  const statsCards = [
    { 
      label: 'Vendas Hoje', 
      value: `R$ ${stats.vendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      change: '+12%', 
      trend: 'up' as const,
      icon: DollarSign 
    },
    { 
      label: 'Pedidos', 
      value: String(stats.pedidosHoje), 
      change: '+5%', 
      trend: 'up' as const,
      icon: ShoppingCart 
    },
    { 
      label: 'Novos Clientes', 
      value: String(stats.novosClientes), 
      change: '-2%', 
      trend: 'down' as const,
      icon: Users 
    },
    { 
      label: 'Produtos Baixo Estoque', 
      value: String(stats.produtosBaixoEstoque), 
      change: '+3', 
      trend: 'up' as const,
      icon: Package 
    },
  ]

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">
            {empresaSelecionada 
              ? `Visão geral da ${empresaSelecionada.nome_fantasia || empresaSelecionada.nome}`
              : 'Visão geral de todas as empresas'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-900 p-1 rounded-lg border border-dark-800">
          {['hoje', 'semana', 'mes'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize
                ${timeRange === range 
                  ? 'bg-primary-600 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
                }
              `}
            >
              {range === 'mes' ? 'Mês' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
              <div className="p-2 bg-dark-800 rounded-lg">
                <stat.icon className="w-5 h-5 text-primary-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {stat.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
              <span className="text-sm text-dark-500">vs. ontem</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pedidos Recentes */}
        <div className="xl:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-dark-100">Pedidos Recentes</h2>
                <p className="text-sm text-dark-500">Últimos pedidos do sistema</p>
              </div>
              <button className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-x-auto -mx-4">
              <table className="table min-w-full">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th className="hidden sm:table-cell">Empresa</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell text-right">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="cursor-pointer">
                      <td className="font-medium text-dark-100">{order.id}</td>
                      <td>{order.cliente}</td>
                      <td className="hidden sm:table-cell">{order.empresa}</td>
                      <td className="font-medium">{order.valor}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td className="hidden sm:table-cell text-right text-dark-500">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {order.tempo}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Atividades */}
        <div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-dark-100">Atividades</h2>
                <p className="text-sm text-dark-500">Atividades recentes</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg shrink-0
                    ${activity.tipo === 'alerta' ? 'bg-red-500/10' : 
                      activity.tipo === 'nota' ? 'bg-green-500/10' : 'bg-primary-500/10'}
                  `}>
                    <activity.icon className={`
                      w-4 h-4
                      ${activity.tipo === 'alerta' ? 'text-red-400' : 
                        activity.tipo === 'nota' ? 'text-green-400' : 'text-primary-400'}
                    `} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-200">{activity.descricao}</p>
                    <p className="text-xs text-dark-500 truncate">{activity.detalhe}</p>
                    <p className="text-xs text-dark-600 mt-1">{activity.tempo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
