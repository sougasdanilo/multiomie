import { useState } from 'react'
import { Save, Bell, Database, Cloud, Palette } from 'lucide-react'
import toast from 'react-hot-toast'

export function Configuracoes() {
  const [config, setConfig] = useState({
    notificacoes_email: true,
    notificacoes_push: true,
    notificacoes_pedidos: true,
    notificacoes_estoque: true,
    tema: 'dark',
    idioma: 'pt-BR',
    fuso_horario: 'America/Sao_Paulo',
    formato_data: 'DD/MM/YYYY',
    formato_moeda: 'BRL',
    casa_decimal: 2,
    separador_decimal: ',',
    separador_milhar: '.',
  })

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!')
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Configurações</h1>
          <p className="section-subtitle">Personalize o sistema de acordo com suas preferências</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" />
          Salvar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Notificações</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-dark-300">E-mail</span>
              <input
                type="checkbox"
                checked={config.notificacoes_email}
                onChange={(e) => setConfig({...config, notificacoes_email: e.target.checked})}
                className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-dark-300">Push</span>
              <input
                type="checkbox"
                checked={config.notificacoes_push}
                onChange={(e) => setConfig({...config, notificacoes_push: e.target.checked})}
                className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-dark-300">Novos Pedidos</span>
              <input
                type="checkbox"
                checked={config.notificacoes_pedidos}
                onChange={(e) => setConfig({...config, notificacoes_pedidos: e.target.checked})}
                className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-dark-300">Estoque Baixo</span>
              <input
                type="checkbox"
                checked={config.notificacoes_estoque}
                onChange={(e) => setConfig({...config, notificacoes_estoque: e.target.checked})}
                className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-600"
              />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Aparência</h2>
          </div>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Tema</label>
              <select
                value={config.tema}
                onChange={(e) => setConfig({...config, tema: e.target.value})}
                className="input"
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
                <option value="system">Sistema</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Idioma</label>
              <select
                value={config.idioma}
                onChange={(e) => setConfig({...config, idioma: e.target.value})}
                className="input"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Regional</h2>
          </div>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Formato de Data</label>
              <select
                value={config.formato_data}
                onChange={(e) => setConfig({...config, formato_data: e.target.value})}
                className="input"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Moeda</label>
              <select
                value={config.formato_moeda}
                onChange={(e) => setConfig({...config, formato_moeda: e.target.value})}
                className="input"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-dark-100">Integrações</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
              <div>
                <p className="font-medium text-dark-200">Omie ERP</p>
                <p className="text-sm text-dark-500">Integração ativa</p>
              </div>
              <span className="badge-green">Conectado</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
              <div>
                <p className="font-medium text-dark-200">Focus NFe</p>
                <p className="text-sm text-dark-500">Emissão de NF-e</p>
              </div>
              <span className="badge-green">Conectado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
