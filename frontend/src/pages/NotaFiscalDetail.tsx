import { ArrowLeft, FileText, Download, Printer, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const mockNF = {
  id: '1',
  numero: '1234',
  serie: '1',
  chave_acesso: '12345678901234567890123456789012345678901234',
  protocolo: '123456789012345',
  empresa: { nome: 'Empresa Matriz LTDA', cnpj: '12.345.678/0001-90', ie: '123.456.789.012' },
  cliente: { nome: 'João Silva', cnpj: '123.456.789-00', ie: '', endereco: 'Rua das Flores, 123 - Centro, São Paulo - SP, CEP: 01000-000' },
  data_emissao: '2024-03-20 14:30:00',
  data_saida: '2024-03-21 08:00:00',
  natureza_operacao: 'Venda de Mercadoria',
  itens: [
    { codigo: 'SKU-001', descricao: 'Notebook Dell i7', ncm: '8471.30.12', cfop: '5102', unidade: 'UN', quantidade: 1, valor_unitario: '5.500,00', valor_total: '5.500,00' },
  ],
  totais: { icms_base: '5.500,00', icms: '660,00', ipi: '0,00', pis: '113,85', cofins: '524,25', total_produtos: '5.500,00', total_nf: '5.500,00' },
  transporte: { modalidade: 'Por conta do destinatário', volumes: 1, especie: 'Caixa', peso_bruto: '2.500', peso_liquido: '2.200' },
  cobranca: { forma_pagamento: 'Boleto', fatura: '001', valor: '5.500,00', vencimento: '2024-04-20' },
  informacoes: { fisco: '', complementares: 'Pedido: PED-001. Operação realizada conforme contrato.' },
}

export function NotaFiscalDetail() {
  const navigate = useNavigate()

  const copyChave = () => {
    navigator.clipboard.writeText(mockNF.chave_acesso)
    toast.success('Chave de acesso copiada!')
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/notas-fiscais')} className="p-2 hover:bg-dark-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="section-title">NF-e {mockNF.numero}</h1>
            <span className="badge-green">Autorizada</span>
          </div>
          <p className="section-subtitle">Série {mockNF.serie} - Emitida em {mockNF.data_emissao}</p>
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
              <code className="flex-1 text-sm text-dark-300 break-all">{mockNF.chave_acesso}</code>
              <button onClick={copyChave} className="p-2 hover:bg-dark-700 rounded-lg"><Copy className="w-4 h-4 text-dark-400" /></button>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Emitente</h2>
            <div>
              <p className="font-medium text-dark-200">{mockNF.empresa.nome}</p>
              <p className="text-sm text-dark-500">CNPJ: {mockNF.empresa.cnpj}</p>
              <p className="text-sm text-dark-500">IE: {mockNF.empresa.ie}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Destinatário</h2>
            <div>
              <p className="font-medium text-dark-200">{mockNF.cliente.nome}</p>
              <p className="text-sm text-dark-500">CNPJ/CPF: {mockNF.cliente.cnpj}</p>
              <p className="text-sm text-dark-500">IE: {mockNF.cliente.ie || 'Isento'}</p>
              <p className="text-sm text-dark-500 mt-2">{mockNF.cliente.endereco}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Itens</h2>
            <div className="space-y-3">
              {mockNF.itens.map((item, idx) => (
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
              <div className="flex justify-between text-dark-400"><span>Base ICMS</span><span>R$ {mockNF.totais.icms_base}</span></div>
              <div className="flex justify-between text-dark-400"><span>ICMS</span><span>R$ {mockNF.totais.icms}</span></div>
              <div className="flex justify-between text-dark-400"><span>IPI</span><span>R$ {mockNF.totais.ipi}</span></div>
              <div className="flex justify-between text-dark-400"><span>PIS</span><span>R$ {mockNF.totais.pis}</span></div>
              <div className="flex justify-between text-dark-400"><span>COFINS</span><span>R$ {mockNF.totais.cofins}</span></div>
              <div className="flex justify-between text-lg font-semibold text-dark-100 pt-2 border-t border-dark-800">
                <span>Total NF</span><span>R$ {mockNF.totais.total_nf}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
