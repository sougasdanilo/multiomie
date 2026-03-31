import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Package, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const mockEstoqueEmpresas = [
  { id: '1', nome: 'Matriz', codigo_omie: '12345', estoque_atual: 15, estoque_minimo: 5, preco_venda: '5.500,00', ultima_consulta: '2024-03-20 14:30' },
  { id: '2', nome: 'SP Filial', codigo_omie: '67890', estoque_atual: 8, estoque_minimo: 3, preco_venda: '5.500,00', ultima_consulta: '2024-03-20 10:15' },
  { id: '3', nome: 'Sul Distrib', codigo_omie: '11121', estoque_atual: 0, estoque_minimo: 2, preco_venda: '5.800,00', ultima_consulta: null },
]

export function ProdutoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState({
    codigo: isNew ? '' : 'SKU-001',
    descricao: isNew ? '' : 'Notebook Dell i7',
    descricao_complementar: isNew ? '' : 'Processador i7, 16GB RAM, SSD 512GB',
    ncm: isNew ? '' : '8471.30.12',
    cest: isNew ? '' : '',
    cfop: isNew ? '' : '5102',
    unidade: isNew ? '' : 'UN',
    preco_base: isNew ? '' : '5500,00',
    ativo: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(isNew ? 'Produto criado com sucesso!' : 'Produto atualizado!')
    navigate('/produtos')
  }

  const handleConsultarEstoque = (_empresaId: string) => {
    toast.success('Consultando estoque no Omie...')
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/produtos')}
          className="p-2 hover:bg-dark-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <h1 className="section-title">{isNew ? 'Novo Produto' : 'Editar Produto'}</h1>
          <p className="section-subtitle">
            {isNew ? 'Cadastre um novo produto no catálogo' : 'Gerencie os dados do produto'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="card space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-dark-800">
                <Package className="w-5 h-5 text-primary-400" />
                <h2 className="font-semibold text-dark-100">Dados do Produto</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Código (SKU) *</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm({...form, codigo: e.target.value})}
                    className="input"
                    placeholder="SKU-001"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Unidade *</label>
                  <input
                    type="text"
                    value={form.unidade}
                    onChange={(e) => setForm({...form, unidade: e.target.value})}
                    className="input"
                    placeholder="UN, KG, MT, etc"
                    required
                  />
                </div>
                
                <div className="form-group md:col-span-2">
                  <label className="form-label">Descrição *</label>
                  <input
                    type="text"
                    value={form.descricao}
                    onChange={(e) => setForm({...form, descricao: e.target.value})}
                    className="input"
                    placeholder="Descrição do produto"
                    required
                  />
                </div>
                
                <div className="form-group md:col-span-2">
                  <label className="form-label">Descrição Complementar</label>
                  <textarea
                    value={form.descricao_complementar}
                    onChange={(e) => setForm({...form, descricao_complementar: e.target.value})}
                    className="input min-h-[80px]"
                    placeholder="Especificações técnicas, características..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">NCM *</label>
                  <input
                    type="text"
                    value={form.ncm}
                    onChange={(e) => setForm({...form, ncm: e.target.value})}
                    className="input"
                    placeholder="0000.00.00"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">CEST</label>
                  <input
                    type="text"
                    value={form.cest}
                    onChange={(e) => setForm({...form, cest: e.target.value})}
                    className="input"
                    placeholder="00.000.00"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">CFOP Padrão</label>
                  <input
                    type="text"
                    value={form.cfop}
                    onChange={(e) => setForm({...form, cfop: e.target.value})}
                    className="input"
                    placeholder="5102"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Preço Base (R$)</label>
                  <input
                    type="text"
                    value={form.preco_base}
                    onChange={(e) => setForm({...form, preco_base: e.target.value})}
                    className="input"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({...form, ativo: e.target.checked})}
                    className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-dark-300">Produto ativo</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/produtos')}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </form>
        </div>

        {/* Estoque por Empresa */}
        {!isNew && (
          <div>
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-primary-400" />
                <h2 className="font-semibold text-dark-100">Estoque por Empresa</h2>
              </div>
              
              <div className="space-y-4">
                {mockEstoqueEmpresas.map((emp) => (
                  <div key={emp.id} className="p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-dark-200">{emp.nome}</span>
                      {emp.estoque_atual > emp.estoque_minimo ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-dark-500">Atual: </span>
                        <span className={emp.estoque_atual < emp.estoque_minimo ? 'text-red-400 font-medium' : 'text-dark-300'}>
                          {emp.estoque_atual}
                        </span>
                      </div>
                      <div>
                        <span className="text-dark-500">Mínimo: </span>
                        <span className="text-dark-300">{emp.estoque_minimo}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-dark-500">Preço Venda: </span>
                        <span className="text-dark-300">R$ {emp.preco_venda}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleConsultarEstoque(emp.id)}
                      className="w-full mt-3 py-1.5 text-xs text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded transition-colors"
                    >
                      {emp.ultima_consulta ? 'Atualizar Estoque' : 'Consultar Estoque'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
