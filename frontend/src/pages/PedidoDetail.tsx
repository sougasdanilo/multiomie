import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, FileText, Printer, RefreshCw } from 'lucide-react'

const mockPedido = {
  id: 'PED-001',
  numero: '001',
  status: 'processando',
  data_criacao: '2024-03-20 14:30',
  cliente: { nome: 'João Silva', cnpj: '123.456.789-00', email: 'joao@email.com' },
  endereco_entrega: { logradouro: 'Rua das Flores', numero: '123', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' },
  itens: [
    { id: '1', produto: 'Notebook Dell i7', quantidade: 1, preco: '5.500,00', total: '5.500,00', empresa: 'Matriz' },
    { id: '2', produto: 'Mouse Logitech MX', quantidade: 2, preco: '450,00', total: '900,00', empresa: 'SP Filial' },
  ],
  totais: { subtotal: '6.400,00', desconto: '0,00', frete: '150,00', total: '6.550,00' },
  empresas_processamento: [
    { nome: 'Matriz', codigo_pedido_omie: '12345', status: 'concluido', valor: '5.500,00' },
    { nome: 'SP Filial', codigo_pedido_omie: '67890', status: 'processando', valor: '900,00' },
  ],
  notas_fiscais: [
    { numero: '1234', serie: '1', empresa: 'Matriz', valor: '5.500,00', status: 'emitida', chave: '12345678901234567890123456789012345678901234' },
  ],
}

export function PedidoDetail() {
  const navigate = useNavigate()

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/pedidos')} className="p-2 hover:bg-dark-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="section-title">Pedido {mockPedido.numero}</h1>
            <span className="badge-blue">{mockPedido.status}</span>
          </div>
          <p className="section-subtitle">Criado em {mockPedido.data_criacao}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Itens do Pedido</h2>
            </div>
            <div className="space-y-3">
              {mockPedido.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge-gray text-[10px]">{item.empresa}</span>
                      <p className="font-medium text-dark-200">{item.produto}</p>
                    </div>
                    <p className="text-sm text-dark-500">Qtd: {item.quantidade} x R$ {item.preco}</p>
                  </div>
                  <span className="font-semibold text-dark-100">R$ {item.total}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dark-800 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-dark-400"><span>Subtotal</span><span>R$ {mockPedido.totais.subtotal}</span></div>
              <div className="flex justify-between text-dark-400"><span>Desconto</span><span>R$ {mockPedido.totais.desconto}</span></div>
              <div className="flex justify-between text-dark-400"><span>Frete</span><span>R$ {mockPedido.totais.frete}</span></div>
              <div className="flex justify-between text-lg font-semibold text-dark-100 pt-2 border-t border-dark-800">
                <span>Total</span><span>R$ {mockPedido.totais.total}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Processamento por Empresa</h2>
            </div>
            <div className="space-y-3">
              {mockPedido.empresas_processamento.map((emp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-dark-200">{emp.nome}</p>
                    <p className="text-sm text-dark-500">Pedido Omie: {emp.codigo_pedido_omie}</p>
                  </div>
                  <div className="text-right">
                    <span className={emp.status === 'concluido' ? 'badge-green' : 'badge-blue'}>
                      {emp.status}
                    </span>
                    <p className="text-sm text-dark-400 mt-1">R$ {emp.valor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Cliente</h2>
            <div>
              <p className="font-medium text-dark-200">{mockPedido.cliente.nome}</p>
              <p className="text-sm text-dark-500">{mockPedido.cliente.cnpj}</p>
              <p className="text-sm text-dark-500">{mockPedido.cliente.email}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-100 mb-4">Endereço de Entrega</h2>
            <p className="text-sm text-dark-300">
              {mockPedido.endereco_entrega.logradouro}, {mockPedido.endereco_entrega.numero}<br />
              {mockPedido.endereco_entrega.bairro}<br />
              {mockPedido.endereco_entrega.cidade} - {mockPedido.endereco_entrega.estado}<br />
              CEP: {mockPedido.endereco_entrega.cep}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-dark-100">Notas Fiscais</h2>
            </div>
            {mockPedido.notas_fiscais.length > 0 ? (
              <div className="space-y-3">
                {mockPedido.notas_fiscais.map((nf, idx) => (
                  <div key={idx} className="p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-dark-200">NF {nf.numero}</span>
                      <span className="badge-green text-xs">{nf.status}</span>
                    </div>
                    <p className="text-sm text-dark-500">{nf.empresa}</p>
                    <p className="text-sm text-dark-400">R$ {nf.valor}</p>
                    <p className="text-xs text-dark-600 mt-1 truncate">{nf.chave}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-500">Nenhuma NF-e emitida</p>
            )}
          </div>

          <div className="flex gap-2">
            <button className="flex-1 btn-secondary"><Printer className="w-4 h-4" /> Imprimir</button>
            <button className="flex-1 btn-primary"><RefreshCw className="w-4 h-4" /> Atualizar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
