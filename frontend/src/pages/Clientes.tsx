import { useState } from 'react'
import { Plus, Search, Edit, RefreshCw, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const mockClientes = [
  { id: '1', nome: 'João Silva', cpf_cnpj: '123.456.789-00', email: 'joao@email.com', telefone: '(11) 98765-4321', empresas_sync: 3, total_pedidos: 12 },
  { id: '2', nome: 'Maria Santos', cpf_cnpj: '987.654.321-00', email: 'maria@email.com', telefone: '(11) 91234-5678', empresas_sync: 2, total_pedidos: 8 },
  { id: '3', nome: 'Pedro Costa', cpf_cnpj: '456.789.123-00', email: 'pedro@email.com', telefone: '(11) 95678-1234', empresas_sync: 1, total_pedidos: 3 },
  { id: '4', nome: 'Ana Paula', cpf_cnpj: '789.123.456-00', email: 'ana@email.com', telefone: '(11) 94321-8765', empresas_sync: 3, total_pedidos: 25 },
]

export function Clientes() {
  const [search, setSearch] = useState('')

  const filteredClientes = mockClientes.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf_cnpj.includes(search)
  )

  const handleSync = (_clienteId: string) => {
    toast.success('Cliente sincronizado com todas as empresas!')
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Clientes</h1>
          <p className="section-subtitle">Cadastro unificado com sincronização automática</p>
        </div>
        
        <Link to="/clientes/novo" className="btn-primary">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-12"
        />
      </div>

      {/* Table */}
      <div className="table-container overflow-x-auto">
        <table className="table min-w-full">
          <thead>
            <tr>
              <th>Cliente</th>
              <th className="hidden sm:table-cell">CPF/CNPJ</th>
              <th className="hidden md:table-cell">Contato</th>
              <th>Empresas</th>
              <th className="hidden sm:table-cell">Pedidos</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                      <span className="text-primary-400 font-medium">
                        {cliente.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-dark-100">{cliente.nome}</p>
                      <p className="text-sm text-dark-500 sm:hidden">{cliente.cpf_cnpj}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell">{cliente.cpf_cnpj}</td>
                <td className="hidden md:table-cell">
                  <div>
                    <p className="text-dark-300">{cliente.email}</p>
                    <p className="text-sm text-dark-500">{cliente.telefone}</p>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{cliente.empresas_sync}/3</span>
                  </div>
                </td>
                <td className="hidden sm:table-cell">{cliente.total_pedidos}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleSync(cliente.id)}
                      className="p-2 hover:bg-dark-800 rounded-lg text-primary-400"
                      title="Sincronizar"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <Link 
                      to={`/clientes/${cliente.id}`}
                      className="p-2 hover:bg-dark-800 rounded-lg"
                    >
                      <Edit className="w-4 h-4 text-dark-400" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
