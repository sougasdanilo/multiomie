import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Building2, Key, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function EmpresaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [showSecret, setShowSecret] = useState(false)
  
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    cnpj: '',
    app_key: '',
    app_secret: '',
    ativa: true,
  })

  useEffect(() => {
    if (!isNew && id) {
      const loadEmpresa = async () => {
        try {
          const response = await fetch(`/api/empresas/${id}`)
          if (response.ok) {
            const data = await response.json()
            setForm(data)
          }
        } catch (error) {
          console.error('Erro ao carregar empresa:', error)
        }
      }
      loadEmpresa()
    }
  }, [id, isNew])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = isNew ? '/api/empresas' : `/api/empresas/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (response.ok) {
        toast.success(isNew ? 'Empresa criada com sucesso!' : 'Empresa atualizada!')
        navigate('/empresas')
      }
    } catch (error) {
      toast.error('Erro ao salvar empresa')
    }
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/empresas')}
          className="p-2 hover:bg-dark-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <h1 className="section-title">{isNew ? 'Nova Empresa' : 'Editar Empresa'}</h1>
          <p className="section-subtitle">
            {isNew ? 'Cadastre um novo CNPJ para integração' : 'Configure os dados da empresa'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="card space-y-6">
          {/* Dados da Empresa */}
          <div className="flex items-center gap-2 pb-4 border-b border-dark-800">
            <Building2 className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Dados da Empresa</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Razão Social</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({...form, nome: e.target.value})}
                className="input"
                placeholder="Ex: Empresa Matriz LTDA"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Nome Fantasia</label>
              <input
                type="text"
                value={form.nome_fantasia}
                onChange={(e) => setForm({...form, nome_fantasia: e.target.value})}
                className="input"
                placeholder="Ex: Matriz"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm({...form, cnpj: e.target.value})}
                className="input"
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
          </div>

          {/* Credenciais Omie */}
          <div className="flex items-center gap-2 pb-4 border-b border-dark-800 pt-4">
            <Key className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Credenciais Omie</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">App Key</label>
              <input
                type="text"
                value={form.app_key}
                onChange={(e) => setForm({...form, app_key: e.target.value})}
                className="input"
                placeholder="Sua App Key do Omie"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">App Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={form.app_secret}
                  onChange={(e) => setForm({...form, app_secret: e.target.value})}
                  className="input pr-10"
                  placeholder="Sua App Secret do Omie"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativa}
                onChange={(e) => setForm({...form, ativa: e.target.checked})}
                className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-300">Empresa ativa</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/empresas')}
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
  )
}
