import { useState, useEffect } from 'react'
import { Search, FileText, Download, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface NotaFiscal {
  id: string
  numero: string
  serie: string
  empresa: string
  cliente: string
  valor: number
  data: string
  status: string
  chave: string
}

const statusConfig = {
  autorizada: { label: 'Autorizada', badge: 'badge-green', icon: CheckCircle },
  cancelada: { label: 'Cancelada', badge: 'badge-red', icon: AlertCircle },
  pendente: { label: 'Pendente', badge: 'badge-yellow', icon: AlertCircle },
}

export function NotasFiscais() {
  const { empresaSelecionada } = useAppStore()
  const [search, setSearch] = useState('')
  const [notas, setNotas] = useState<NotaFiscal[]>([])

  useEffect(() => {
    const loadNotas = async () => {
      try {
        const url = empresaSelecionada
          ? `/api/notas-fiscais?empresa_id=${empresaSelecionada.id}`
          : '/api/notas-fiscais'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setNotas(data)
        }
      } catch (error) {
        console.error('Erro ao carregar notas:', error)
      }
    }
    loadNotas()
  }, [empresaSelecionada])

  const filteredNFs = notas.filter(nf => 
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
                  <td className="font-medium">R$ {nf.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
