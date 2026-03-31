import { useState } from 'react'
import { User, Mail, Phone, Camera, Lock, Save } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function Perfil() {
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: '(11) 98765-4321',
    cargo: 'Administrador',
  })

  const handleSave = () => {
    toast.success('Perfil atualizado com sucesso!')
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Meu Perfil</h1>
          <p className="section-subtitle">Gerencie suas informações pessoais</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" />
          Salvar
        </button>
      </div>

      <div className="max-w-2xl">
        <div className="card mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-dark-300">
                  {form.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full hover:bg-primary-500">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark-100">{form.nome}</h2>
              <p className="text-dark-500">{form.cargo}</p>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-dark-800">
            <User className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Informações Pessoais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({...form, nome: e.target.value})}
                className="input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm({...form, telefone: e.target.value})}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-6">
          <div className="flex items-center gap-2 pb-4 border-b border-dark-800">
            <Lock className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Segurança</h2>
          </div>
          <div className="pt-4 space-y-4">
            <button className="btn-outline w-full sm:w-auto">
              Alterar Senha
            </button>
            <p className="text-sm text-dark-500">
              Última alteração: 30 dias atrás
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
