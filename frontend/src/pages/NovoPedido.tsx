import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Send,
  CheckCircle,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../stores/appStore'

interface Cliente {
  id: string
  nome: string
  cnpj: string
}

interface Produto {
  id: string
  codigo: string
  descricao: string
  preco: string
  estoque: Record<string, number>
}

interface ItemPedido {
  id: string
  produto_id: string
  descricao: string
  quantidade: number
  preco_unitario: string
  empresa_id: string
  empresa_sigla: string
}

export function NovoPedido() {
  const navigate = useNavigate()
  const { empresas } = useAppStore()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clienteId, setClienteId] = useState('')
  const [itens, setItens] = useState<ItemPedido[]>([])
  const [showProdutoModal, setShowProdutoModal] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [empresaSelecionada, setEmpresaSelecionada] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientesRes, produtosRes] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/produtos')
        ])
        if (clientesRes.ok) setClientes(await clientesRes.json())
        if (produtosRes.ok) setProdutos(await produtosRes.json())
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    loadData()
  }, [])

  const clienteSelecionado = clientes.find(c => c.id === clienteId)

  const adicionarItem = () => {
    const produto = produtos.find(p => p.id === produtoSelecionado)
    const empresa = empresas.find(e => e.id === empresaSelecionada)
    
    if (!produto || !empresa) return

    const novoItem: ItemPedido = {
      id: Date.now().toString(),
      produto_id: produto.id,
      descricao: produto.descricao,
      quantidade,
      preco_unitario: produto.preco,
      empresa_id: empresa.id,
      empresa_sigla: empresa.nome_fantasia?.substring(0, 3).toUpperCase() || empresa.nome.substring(0, 3).toUpperCase(),
    }

    setItens([...itens, novoItem])
    setShowProdutoModal(false)
    setProdutoSelecionado('')
    setQuantidade(1)
    setEmpresaSelecionada('')
  }

  const removerItem = (id: string) => {
    setItens(itens.filter(i => i.id !== id))
  }

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      const preco = parseFloat(item.preco_unitario.replace('.', '').replace(',', '.'))
      return total + (preco * item.quantidade)
    }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const handleSalvarRascunho = () => {
    toast.success('Pedido salvo como rascunho!')
    navigate('/pedidos')
  }

  const handleFinalizar = () => {
    if (!clienteId) {
      toast.error('Selecione um cliente')
      return
    }
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item')
      return
    }
    toast.success('Pedido criado e enviado para processamento!')
    navigate('/pedidos')
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/pedidos')}
          className="p-2 hover:bg-dark-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <h1 className="section-title">Novo Pedido</h1>
          <p className="section-subtitle">Crie um pedido com itens de múltiplas empresas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Cliente</h2>
            </div>
            
            {!clienteSelecionado ? (
              <div className="relative">
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="input"
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} - {c.cnpj}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-dark-200">{clienteSelecionado.nome}</p>
                  <p className="text-sm text-dark-500">{clienteSelecionado.cnpj}</p>
                </div>
                <button 
                  onClick={() => setClienteId('')}
                  className="p-2 hover:bg-dark-700 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-dark-400" />
                </button>
              </div>
            )}
          </div>

          {/* Itens */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary-400" />
                <h2 className="font-semibold text-dark-100">Itens do Pedido</h2>
              </div>
              <button 
                onClick={() => setShowProdutoModal(true)}
                className="btn-secondary text-sm"
                disabled={!clienteId}
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            
            {itens.length === 0 ? (
              <div className="text-center py-8 text-dark-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum item adicionado</p>
                <p className="text-sm">Clique em "Adicionar" para incluir produtos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge-blue text-[10px]">{item.empresa_sigla}</span>
                        <p className="font-medium text-dark-200">{item.descricao}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-dark-500">
                        <span>Qtd: {item.quantidade}</span>
                        <span>R$ {item.preco_unitario}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removerItem(item.id)}
                      className="p-2 hover:bg-dark-700 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Observações</h2>
            </div>
            <textarea
              className="input min-h-[100px]"
              placeholder="Observações gerais do pedido..."
            />
          </div>
        </div>

        {/* Resumo */}
        <div>
          <div className="card sticky top-6">
            <h2 className="font-semibold text-dark-100 mb-4">Resumo</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-dark-500">Itens:</span>
                <span className="text-dark-200">{itens.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-500">Empresas:</span>
                <span className="text-dark-200">
                  {new Set(itens.map(i => i.empresa_id)).size}
                </span>
              </div>
            </div>
            
            <div className="border-t border-dark-800 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-dark-500">Total:</span>
                <span className="text-2xl font-bold text-dark-100">{calcularTotal()}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleSalvarRascunho}
                className="w-full btn-outline"
              >
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </button>
              <button 
                onClick={handleFinalizar}
                className="w-full btn-primary"
                disabled={!clienteId || itens.length === 0}
              >
                <Send className="w-4 h-4" />
                Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Produto */}
      {showProdutoModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowProdutoModal(false)}
          />
          <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-dark-900 border border-dark-800 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-dark-800">
              <h3 className="font-semibold text-dark-100">Adicionar Produto</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="form-group">
                <label className="form-label">Produto</label>
                <select
                  value={produtoSelecionado}
                  onChange={(e) => setProdutoSelecionado(e.target.value)}
                  className="input"
                >
                  <option value="">Selecione...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.descricao} (R$ {p.preco})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Empresa (Estoque)</label>
                <select
                  value={empresaSelecionada}
                  onChange={(e) => setEmpresaSelecionada(e.target.value)}
                  className="input"
                >
                  <option value="">Selecione...</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome_fantasia || e.nome}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  className="input"
                  min={1}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-dark-800 flex justify-end gap-3">
              <button 
                onClick={() => setShowProdutoModal(false)}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button 
                onClick={adicionarItem}
                className="btn-primary"
                disabled={!produtoSelecionado || !empresaSelecionada}
              >
                Adicionar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
