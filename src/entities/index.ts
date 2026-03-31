export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  codigoPais?: string;
}

export interface DadosFiscais {
  ie?: string;
  im?: string;
  tipoContribuinte?: '1' | '2' | '9';
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  nomeFantasia?: string;
  appKey: string;
  appSecret: string;
  ativa: boolean;
  configuracoes?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: Endereco;
  dadosFiscais?: DadosFiscais;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClienteEmpresa {
  id: string;
  clienteId: string;
  empresaId: string;
  codigoOmie: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  lastSync?: Date;
  syncError?: string;
  dadosCustomizados?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Produto {
  id: string;
  codigo: string;
  descricao: string;
  descricaoComplementar?: string;
  ncm: string;
  cest?: string;
  cfop?: string;
  unidade: string;
  precoBase?: number;
  tipo: 'PRODUTO' | 'SERVICO' | 'KIT';
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProdutoEmpresa {
  id: string;
  produtoId: string;
  empresaId: string;
  codigoOmie: string;
  estoqueMinimo: number;
  estoqueAtual: number;
  estoqueReservado: number;
  ultimaConsulta?: Date;
  precoVenda?: number;
  configFiscal?: Record<string, unknown>;
  dadosOmie?: Record<string, unknown>;
}

export interface EstoqueInfo {
  produtoId: string;
  empresaId: string;
  codigoOmie: string;
  saldo: number;
  reservado: number;
  disponivel: number;
  ultimaConsulta: Date;
}

export type PedidoStatus = 
  | 'RASCUNHO' 
  | 'VALIDADO' 
  | 'PROCESSANDO' 
  | 'FATURANDO' 
  | 'CONCLUIDO' 
  | 'CANCELADO';

export interface Pedido {
  id: string;
  numero: string;
  clienteId: string;
  status: PedidoStatus;
  substatus?: string;
  valorProdutos: number;
  valorDesconto: number;
  valorFrete: number;
  valorTotal: number;
  enderecoEntrega?: Endereco;
  dataPrevisao?: Date;
  formaPagamento?: string;
  condicaoPagamento?: string;
  observacoes?: string;
  observacaoInterna?: string;
  usuarioId?: string;
  itens: PedidoItem[];
  pedidosEmpresa?: PedidoEmpresa[];
  notasFiscais?: NotaFiscal[];
  processadoAt?: Date;
  faturadoAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PedidoItem {
  id: string;
  pedidoId: string;
  produtoId: string;
  produto?: Produto;
  empresaId: string;
  empresa?: Empresa;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  percentualDesconto: number;
  valorDesconto: number;
  sequencia: number;
  ncm?: string;
  cfop?: string;
}

export interface PedidoEmpresa {
  id: string;
  pedidoId: string;
  empresaId: string;
  empresa?: Empresa;
  codigoPedidoOmie?: string;
  numeroPedidoOmie?: string;
  statusOmie?: string;
  valorItens?: number;
  valorTotal?: number;
  respostaOmie?: Record<string, unknown>;
  tentativas: number;
  ultimoErro?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotaFiscalStatus = 'EMITIDA' | 'CANCELADA' | 'INUTILIZADA';

export interface NotaFiscal {
  id: string;
  pedidoId: string;
  empresaId: string;
  empresa?: Empresa;
  numero: string;
  serie: string;
  chaveAcesso: string;
  protocolo?: string;
  dataEmissao: Date;
  dataSaida?: Date;
  valorProdutos: number;
  valorDesconto: number;
  valorTotal: number;
  xmlUrl?: string;
  pdfUrl?: string;
  status: NotaFiscalStatus;
  motivoCancelamento?: string;
  dadosOmie?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
