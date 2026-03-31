import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, FileText, Printer, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Pedido {
  id: string
  numero: string
  status: string
  data_criacao: string
  cliente: { nome: string; cnpj: string; email: string }
  endereco_entrega: { logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string }
  itens: Array<{ id: string; produto: string; quantidade: number; preco: string; total: string; empresa: string }>
  totais: { subtotal: string; desconto: string; frete: string; total: string }
  empresas_processamento: Array<{ nome: string; codigo_pedido_omie: string; status: string; valor: string }>
  notas_fiscais: Array<{ numero: string; serie: string; empresa: string; valor: string; status: string; chave: string }>
}

export function PedidoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      const loadPedido = async () => {
        try {
          const response = await fetch(`/api/pedidos/${id}`)
          if (response.ok) {
            setPedido(await response.json())
          }
        } catch (error) {
          console.error('Erro ao carregar pedido:', error)
        } finally {
          setIsLoading(false)
        }
      }
      loadPedido()
    }
  }, [id])

  const handleAtualizar = async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/pedidos/${id}/atualizar`, { method: 'POST' })
      if (response.ok) {
        toast.success('Status do pedido atualizado!')
        const pedidoRes = await fetch(`/api/pedidos/${id}`)
        if (pedidoRes.ok) setPedido(await pedidoRes.json())
      }
    } catch (error) {
      toast.error('Erro ao atualizar pedido')
    }
  }

  if (isLoading) return <div className="page-container">Carregando...</div>
  if (!pedido) return <div className="page-container">Pedido não encontrado</div>

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/pedidos')} className="p-2 hover:bg-dark-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="section-title">Pedido {pedido.numero}</h1>
            <span className="badge-blue">{pedido.status}</span>
          </div>
          <p className="section-subtitle">Criado em {pedido.data_criacao}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Itens do Pedido</h2>
            </div>
            <div className="space-y-3">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge-gray text-[10px]">{item.empresa}</span>
                      <p className="font-medium text-dark-200">{item.produto}</p>
                    </div>
                    <p className="text-sm text-dark-500">Qtd: {item.quantidade} x R$ {item.preco}</p>
                  </div>
                  <span className="font-semibold text-dark-100">R$ {item.total}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dark-800 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-dark-400"><span>Subtotal</span><span>R$ {pedido.totais.subtotal}</span></div>
              <div className="flex justify-between text-dark-400"><span>Desconto</span><span>R$ {pedido.totais.desconto}</span></div>
              <div className="flex justify-between text-dark-400"><span>Frete</span><span>R$ {pedido.totais.frete}</span></div>
              <div className="flex justify-between text-lg font-semibold text-dark-100 pt-2 border-t border-dark-800">
                <span>Total</span><span>R$ {pedido.totais.total}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Processamento por Empresa</h2>
            </div>
            <div className="space-y-3">
              {pedido.empresas_processamento.map((emp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-dark-200">{emp.nome}</p>
                    <p className="text-sm text-dark-500">Pedido Omie: {emp.codigo_pedido_omie}</p>
                  </div>
                  <div className="text-right">
                    <span className={emp.status === 'concluido' ? 'badge-green' : 'badge-blue'}>
                      {emp.status}
                    </span>
                    <p className="text-sm text-dark-400 mt-1">R$ {emp.valor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Cliente</h2>
            <div>
              <p className="font-medium text-dark-200">{pedido.cliente.nome}</p>
              <p className="text-sm text-dark-500">{pedido.cliente.cnpj}</p>
              <p className="text-sm text-dark-500">{pedido.cliente.email}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Endereço de Entrega</h2>
            <p className="text-sm text-dark-300">
              {pedido.endereco_entrega.logradouro}, {pedido.endereco_entrega.numero}<br />
              {pedido.endereco_entrega.bairro}<br />
              {pedido.endereco_entrega.cidade} - {pedido.endereco_entrega.estado}<br />
              CEP: {pedido.endereco_entrega.cep}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Notas Fiscais</h2>
            </div>
            {pedido.notas_fiscais.length > 0 ? (
              <div className="space-y-3">
                {pedido.notas_fiscais.map((nf, idx) => (
                  <div key={idx} className="p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-dark-200">NF {nf.numero}</span>
                      <span className="badge-green text-xs">{nf.status}</span>
                    </div>
                    <p className="text-sm text-dark-500">{nf.empresa}</p>
                    <p className="text-sm text-dark-400">R$ {nf.valor}</p>
                    <p className="text-xs text-dark-600 mt-1 truncate">{nf.chave}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-500">Nenhuma NF-e emitida</p>
            )}
          </div>

          <div className="flex gap-2">
            <button className="flex-1 btn-secondary"><Printer className="w-4 h-4" /> Imprimir</button>
            <button className="flex-1 btn-primary" onClick={handleAtualizar}><RefreshCw className="w-4 h-4" /> Atualizar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
