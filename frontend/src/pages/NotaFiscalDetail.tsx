import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Download, Printer, Copy } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface NotaFiscal {
  id: string
  numero: string
  serie: string
  chave_acesso: string
  protocolo: string
  empresa: { nome: string; cnpj: string; ie: string }
  cliente: { nome: string; cnpj: string; ie: string; endereco: string }
  data_emissao: string
  data_saida: string
  natureza_operacao: string
  itens: Array<{ codigo: string; descricao: string; ncm: string; cfop: string; unidade: string; quantidade: number; valor_unitario: string; valor_total: string }>
  totais: { icms_base: string; icms: string; ipi: string; pis: string; cofins: string; total_produtos: string; total_nf: string }
}

export function NotaFiscalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nf, setNf] = useState<NotaFiscal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      const loadNF = async () => {
        try {
          const response = await fetch(`/api/notas-fiscais/${id}`)
          if (response.ok) {
            setNf(await response.json())
          }
        } catch (error) {
          console.error('Erro ao carregar nota fiscal:', error)
        } finally {
          setIsLoading(false)
        }
      }
      loadNF()
    }
  }, [id])

  const copyChave = () => {
    if (!nf) return
    navigator.clipboard.writeText(nf.chave_acesso)
    toast.success('Chave de acesso copiada!')
  }

  if (isLoading) return <div className="page-container">Carregando...</div>
  if (!nf) return <div className="page-container">Nota fiscal não encontrada</div>

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/notas-fiscais')} className="p-2 hover:bg-dark-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="section-title">NF-e {nf.numero}</h1>
            <span className="badge-green">Autorizada</span>
          </div>
          <p className="section-subtitle">Série {nf.serie} - Emitida em {nf.data_emissao}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button className="btn-secondary"><FileText className="w-4 h-4" /> XML</button>
        <button className="btn-secondary"><FileText className="w-4 h-4" /> DANFE</button>
        <button className="btn-secondary"><Printer className="w-4 h-4" /> Imprimir</button>
        <button className="btn-secondary"><Download className="w-4 h-4" /> Download</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Chave de Acesso</h2>
            <div className="flex items-center gap-2 p-3 bg-dark-800/50 rounded-lg">
              <code className="flex-1 text-sm text-dark-300 break-all">{nf.chave_acesso}</code>
              <button onClick={copyChave} className="p-2 hover:bg-dark-700 rounded-lg"><Copy className="w-4 h-4 text-dark-400" /></button>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Emitente</h2>
            <div>
              <p className="font-medium text-dark-200">{nf.empresa.nome}</p>
              <p className="text-sm text-dark-500">CNPJ: {nf.empresa.cnpj}</p>
              <p className="text-sm text-dark-500">IE: {nf.empresa.ie}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Destinatário</h2>
            <div>
              <p className="font-medium text-dark-200">{nf.cliente.nome}</p>
              <p className="text-sm text-dark-500">CNPJ/CPF: {nf.cliente.cnpj}</p>
              <p className="text-sm text-dark-500">IE: {nf.cliente.ie || 'Isento'}</p>
              <p className="text-sm text-dark-500 mt-2">{nf.cliente.endereco}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Itens</h2>
            <div className="space-y-3">
              {nf.itens.map((item, idx) => (
                <div key={idx} className="p-3 bg-dark-800/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-dark-200">{item.codigo} - {item.descricao}</span>
                    <span className="text-dark-300">R$ {item.valor_total}</span>
                  </div>
                  <div className="text-dark-500 mt-1">
                    NCM: {item.ncm} | CFOP: {item.cfop} | {item.quantidade} {item.unidade} x R$ {item.valor_unitario}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Totais</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-dark-400"><span>Base ICMS</span><span>R$ {nf.totais.icms_base}</span></div>
              <div className="flex justify-between text-dark-400"><span>ICMS</span><span>R$ {nf.totais.icms}</span></div>
              <div className="flex justify-between text-dark-400"><span>IPI</span><span>R$ {nf.totais.ipi}</span></div>
              <div className="flex justify-between text-dark-400"><span>PIS</span><span>R$ {nf.totais.pis}</span></div>
              <div className="flex justify-between text-dark-400"><span>COFINS</span><span>R$ {nf.totais.cofins}</span></div>
              <div className="flex justify-between text-lg font-semibold text-dark-100 pt-2 border-t border-dark-800">
                <span>Total NF</span><span>R$ {nf.totais.total_nf}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
