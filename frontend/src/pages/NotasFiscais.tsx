import { useState } from 'react'
import { Search, FileText, Download, CheckCircle, AlertCircle, Calendar } from 'lucide-react'

const mockNFs = [
  { id: '1', numero: '1234', serie: '1', empresa: 'Matriz', cliente: 'João Silva', valor: '5.500,00', data: '2024-03-20', status: 'autorizada', chave: '12345678901234567890123456789012345678901234' },
  { id: '2', numero: '1235', serie: '1', empresa: 'SP Filial', cliente: 'Maria Santos', valor: '3.450,00', data: '2024-03-19', status: 'autorizada', chave: '12345678901234567890123456789012345678901235' },
  { id: '3', numero: '1236', serie: '1', empresa: 'Matriz', cliente: 'Pedro Costa', valor: '890,00', data: '2024-03-18', status: 'cancelada', chave: '12345678901234567890123456789012345678901236' },
  { id: '4', numero: '1237', serie: '1', empresa: 'Sul Distrib', cliente: 'Ana Paula', valor: '2.100,00', data: '2024-03-18', status: 'autorizada', chave: '12345678901234567890123456789012345678901237' },
]

const statusConfig = {
  autorizada: { label: 'Autorizada', badge: 'badge-green', icon: CheckCircle },
  cancelada: { label: 'Cancelada', badge: 'badge-red', icon: AlertCircle },
  pendente: { label: 'Pendente', badge: 'badge-yellow', icon: AlertCircle },
}

export function NotasFiscais() {
  const [search, setSearch] = useState('')

  const filteredNFs = mockNFs.filter(nf => 
    nf.cliente.toLowerCase().includes(search.toLowerCase()) ||
    nf.numero.includes(search)
  )

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Notas Fiscais</h1>
          <p className="section-subtitle">NF-es emitidas pelo sistema</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          placeholder="Buscar por número ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-12"
        />
      </div>

      <div className="table-container overflow-x-auto">
        <table className="table min-w-full">
          <thead>
            <tr>
              <th>Número</th>
              <th className="hidden sm:table-cell">Empresa</th>
              <th>Cliente</th>
              <th className="hidden md:table-cell">Data</th>
              <th>Valor</th>
              <th>Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredNFs.map((nf) => {
              const StatusIcon = statusConfig[nf.status as keyof typeof statusConfig].icon
              return (
                <tr key={nf.id}>
                  <td className="font-medium text-dark-100">{nf.numero}</td>
                  <td className="hidden sm:table-cell">{nf.empresa}</td>
                  <td>{nf.cliente}</td>
                  <td className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-dark-400">
                      <Calendar className="w-3 h-3" />
                      {nf.data}
                    </div>
                  </td>
                  <td className="font-medium">R$ {nf.valor}</td>
                  <td>
                    <span className={statusConfig[nf.status as keyof typeof statusConfig].badge}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusConfig[nf.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-dark-800 rounded-lg" title="Download XML">
                        <Download className="w-4 h-4 text-dark-400" />
                      </button>
                      <button className="p-2 hover:bg-dark-800 rounded-lg" title="Download PDF">
                        <FileText className="w-4 h-4 text-dark-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
