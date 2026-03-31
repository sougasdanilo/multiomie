import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const stats = [
  { 
    label: 'Vendas Hoje', 
    value: 'R$ 12.450,00', 
    change: '+12%', 
    trend: 'up',
    icon: DollarSign 
  },
  { 
    label: 'Pedidos', 
    value: '28', 
    change: '+5%', 
    trend: 'up',
    icon: ShoppingCart 
  },
  { 
    label: 'Novos Clientes', 
    value: '7', 
    change: '-2%', 
    trend: 'down',
    icon: Users 
  },
  { 
    label: 'Produtos Baixo Estoque', 
    value: '12', 
    change: '+3', 
    trend: 'up',
    icon: Package 
  },
]

const recentOrders = [
  { id: 'PED-001', cliente: 'João Silva', valor: 'R$ 1.250,00', status: 'processando', empresa: 'Matriz', tempo: '2 min' },
  { id: 'PED-002', cliente: 'Maria Santos', valor: 'R$ 3.450,00', status: 'concluido', empresa: 'SP Filial', tempo: '1 h' },
  { id: 'PED-003', cliente: 'Pedro Costa', valor: 'R$ 890,00', status: 'pendente', empresa: 'Matriz', tempo: '3 h' },
  { id: 'PED-004', cliente: 'Ana Paula', valor: 'R$ 2.100,00', status: 'concluido', empresa: 'Sul Distrib', tempo: '5 h' },
  { id: 'PED-005', cliente: 'Carlos Lima', valor: 'R$ 4.550,00', status: 'faturando', empresa: 'Matriz', tempo: '6 h' },
]

const activities = [
  { tipo: 'pedido', descricao: 'Novo pedido criado', detalhe: 'PED-001 - João Silva', tempo: '2 min atrás', icon: ShoppingCart },
  { tipo: 'cliente', descricao: 'Cliente sincronizado', detalhe: 'Maria Santos - 3 empresas', tempo: '15 min atrás', icon: Users },
  { tipo: 'nota', descricao: 'NF-e emitida', detalhe: 'NF 1234 - R$ 3.450,00', tempo: '1 h atrás', icon: CheckCircle },
  { tipo: 'alerta', descricao: 'Estoque baixo', detalhe: 'Produto SKU-123 (Matriz)', tempo: '2 h atrás', icon: AlertCircle },
]

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
        {stats.map((stat, index) => (
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
