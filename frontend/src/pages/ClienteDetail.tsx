import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, RefreshCw, Building2, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const mockEmpresasSync = [
  { id: '1', nome: 'Matriz', codigo_omie: '12345', status: 'synced', last_sync: '2024-03-20 14:30' },
  { id: '2', nome: 'SP Filial', codigo_omie: '67890', status: 'synced', last_sync: '2024-03-20 14:30' },
  { id: '3', nome: 'Sul Distrib', codigo_omie: null, status: 'pending', last_sync: null },
]

export function ClienteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  
  const [form, setForm] = useState({
    nome: isNew ? '' : 'João Silva',
    cpf_cnpj: isNew ? '' : '123.456.789-00',
    email: isNew ? '' : 'joao@email.com',
    telefone: isNew ? '' : '(11) 98765-4321',
    celular: isNew ? '' : '(11) 98765-4321',
    endereco: {
      logradouro: isNew ? '' : 'Rua das Flores',
      numero: isNew ? '' : '123',
      complemento: isNew ? '' : 'Apto 45',
      bairro: isNew ? '' : 'Centro',
      cidade: isNew ? '' : 'São Paulo',
      estado: isNew ? '' : 'SP',
      cep: isNew ? '' : '01000-000',
    },
    ie: '',
    im: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(isNew ? 'Cliente criado com sucesso!' : 'Cliente atualizado!')
    navigate('/clientes')
  }

  const handleSync = () => {
    toast.success('Sincronizando cliente em todas as empresas...')
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/clientes')}
          className="p-2 hover:bg-dark-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <h1 className="section-title">{isNew ? 'Novo Cliente' : 'Editar Cliente'}</h1>
          <p className="section-subtitle">
            {isNew ? 'Cadastre um novo cliente' : 'Gerencie os dados do cliente'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="card space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-dark-800">
                <User className="w-5 h-5 text-primary-400" />
                <h2 className="font-semibold text-dark-100">Dados Pessoais</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({...form, nome: e.target.value})}
                    className="input"
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">CPF/CNPJ *</label>
                  <input
                    type="text"
                    value={form.cpf_cnpj}
                    onChange={(e) => setForm({...form, cpf_cnpj: e.target.value})}
                    className="input"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="input"
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({...form, telefone: e.target.value})}
                    className="input"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Celular</label>
                  <input
                    type="text"
                    value={form.celular}
                    onChange={(e) => setForm({...form, celular: e.target.value})}
                    className="input"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pb-4 border-b border-dark-800 pt-4">
                <Building2 className="w-5 h-5 text-primary-400" />
                <h2 className="font-semibold text-dark-100">Endereço</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Logradouro</label>
                  <input
                    type="text"
                    value={form.endereco.logradouro}
                    onChange={(e) => setForm({...form, endereco: {...form.endereco, logradouro: e.target.value}})}
                    className="input"
                    placeholder="Rua, Avenida, etc"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Número</label>
                  <input
                    type="text"
                    value={form.endereco.numero}
                    onChange={(e) => setForm({...form, endereco: {...form.endereco, numero: e.target.value}})}
                    className="input"
                    placeholder="123"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Complemento</label>
                  <input
                    type="text"
                    value={form.endereco.complemento}
                    onChange={(e) => setForm({...form, endereco: {...form.endereco, complemento: e.target.value}})}
                    className="input"
                    placeholder="Apto, Sala, etc"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Bairro</label>
                  <input
                    type="text"
                    value={form.endereco.bairro}
                    onChange={(e) => setForm({...form, endereco: {...form.endereco, bairro: e.target.value}})}
                    className="input"
                    placeholder="Bairro"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input
                    type="text"
                    value={form.endereco.cidade}
                    onChange={(e) => setForm({...form, endereco: {...form.endereco, cidade: e.target.value}})}
                    className="input"
                    placeholder="Cidade"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <input
                    type="text"
                    value={form.endereco.estado}
                    onChange={(e) => setForm({...form, endereco: {...form.endereco, estado: e.target.value}})}
                    className="input"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">CEP</label>
                  <input
                    type="text"
                    value={form.endereco.cep}
                    onChange={(e) => setForm({...form, endereco: {...form.endereco, cep: e.target.value}})}
                    className="input"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/clientes')}
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

        {/* Sincronização */}
        {!isNew && (
          <div>
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-primary-400" />
                <h2 className="font-semibold text-dark-100">Sincronização</h2>
              </div>
              
              <p className="text-sm text-dark-500 mb-4">
                Status de sincronização do cliente nas empresas Omie
              </p>
              
              <div className="space-y-3">
                {mockEmpresasSync.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-dark-200">{emp.nome}</p>
                      {emp.codigo_omie ? (
                        <p className="text-xs text-dark-500">Código: {emp.codigo_omie}</p>
                      ) : (
                        <p className="text-xs text-yellow-400">Não sincronizado</p>
                      )}
                    </div>
                    {emp.status === 'synced' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                ))}
              </div>
              
              <button 
                onClick={handleSync}
                className="w-full btn-outline mt-4"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar Todas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
