# Modelo de Dados (Entidades)

## Diagrama Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODELO DE DADOS ERP                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   empresas    │     │   clientes    │     │   produtos    │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ id            │     │ id            │     │ id            │
│ nome          │     │ nome          │     │ codigo        │
│ cnpj          │◄────┤ cpf_cnpj      │     │ descricao     │
│ app_key       │     │ email         │     │ ncm           │
│ app_secret    │     │ telefone      │     │ unidade       │
│ ativa         │     │ endereco      │     │ preco_base    │
│ created_at    │     │ created_at    │     │ ativo         │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        │     ┌───────────────┘                     │
        │     │                                     │
        ▼     ▼                                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│cliente_empresa│     │   pedidos     │     │produto_empresa│
├───────────────┤     ├───────────────┤     ├───────────────┤
│ id            │     │ id            │     │ id            │
│ cliente_id    │────►│ cliente_id    │     │ produto_id    │◄────┐
│ empresa_id    │◄────┤ numero        │     │ empresa_id    │◄────┤
│ codigo_omie   │     │ status        │     │ codigo_omie   │     │
│ sync_status   │     │ valor_total   │     │ estoque_min   │     │
│ last_sync     │     │ observacoes   │     │ estoque_atual │     │
└───────────────┘     │ created_at    │     │ preco_custom  │     │
                      └───────┬───────┘     └───────────────┘     │
                              │                                   │
                              ▼                                   │
                      ┌───────────────┐                          │
                      │ pedido_itens  │                          │
                      ├───────────────┤                          │
                      │ id            │                          │
                      │ pedido_id     │◄─────────────────────────┘
                      │ produto_id    │◄──────────────────────────┘
                      │ empresa_id    │◄───────────────────────────┐
                      │ quantidade    │                          │
                      │ preco_unitario│                          │
                      │ valor_total   │                          │
                      └───────┬───────┘                          │
                              │                                  │
                              ▼                                  │
                      ┌───────────────┐     ┌───────────────┐   │
                      │pedido_empresas│     │ notas_fiscais │   │
                      ├───────────────┤     ├───────────────┤   │
                      │ id            │     │ id            │   │
                      │ pedido_id     │◄────┤ pedido_id     │   │
                      │ empresa_id    │◄────┤ empresa_id    │◄──┘
                      │ codigo_omie   │     │ numero        │
                      │ numero_omie   │     │ serie         │
                      │ status        │     │ chave_acesso  │
                      │ valor         │     │ valor         │
                      └───────────────┘     │ xml_url       │
                                            │ pdf_url       │
                                            │ status        │
                                            └───────────────┘

┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│sincronizacoes │     │   auditoria   │     │    filas      │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ id            │     │ id            │     │ id            │
│ tipo          │     │ entidade      │     │ tipo          │
│ entidade_id   │     │ entidade_id   │     │ payload       │
│ empresa_id    │     │ acao          │     │ status        │
│ status        │     │ dados_anteriores     │ tentativas    │
│ mensagem      │     │ dados_novos   │     │ erro          │
│ created_at    │     │ usuario_id    │     │ created_at    │
└───────────────┘     │ created_at    │     │ processed_at  │
                      └───────────────┘     └───────────────┘
```

## Schema Prisma

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================================================
// EMPRESAS (CNPJs configurados no Omie)
// =====================================================
model Empresa {
  id            String   @id @default(uuid())
  nome          String
  cnpj          String   @unique
  nome_fantasia String?
  
  // Credenciais Omie (criptografadas)
  app_key       String   // Omie App Key
  app_secret    String   // Omie App Secret (criptografado)
  
  // Configurações
  ativa         Boolean  @default(true)
  configuracoes Json?    // Configurações específicas da empresa
  
  // Relacionamentos
  clienteEmpresas ClienteEmpresa[]
  produtoEmpresas ProdutoEmpresa[]
  pedidoEmpresas  PedidoEmpresa[]
  notasFiscais    NotaFiscal[]
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("empresas")
}

// =====================================================
// CLIENTES (Cadastro Unificado)
// =====================================================
model Cliente {
  id         String   @id @default(uuid())
  
  // Dados cadastrais
  nome       String
  cpf_cnpj   String   @unique
  email      String?
  telefone   String?
  celular    String?
  
  // Endereço
  endereco       String?
  numero         String?
  complemento    String?
  bairro         String?
  cidade         String?
  estado         String?
  cep            String?
  codigo_pais    String?  @default("1058") // Brasil
  
  // Dados fiscais
  ie             String?  // Inscrição Estadual
  im             String?  // Inscrição Municipal
  tipo_contribuinte String? // 1=Contribuinte, 2=Não contribuinte, 9=Outros
  
  // Relacionamentos
  clienteEmpresas ClienteEmpresa[]
  pedidos         Pedido[]
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("clientes")
}

// =====================================================
// CLIENTE_EMPRESA (Mapeamento Cliente → Omie por Empresa)
// =====================================================
model ClienteEmpresa {
  id       String @id @default(uuid())
  
  // Relacionamentos
  cliente_id  String
  cliente     Cliente  @relation(fields: [cliente_id], references: [id], onDelete: Cascade)
  
  empresa_id  String
  empresa     Empresa  @relation(fields: [empresa_id], references: [id], onDelete: Cascade)
  
  // Código do cliente no Omie desta empresa
  codigo_omie String
  
  // Status de sincronização
  sync_status String   @default("SYNCED") // SYNCED, PENDING, ERROR
  last_sync   DateTime?
  sync_error  String?
  
  // Dados específicos da empresa (se diferirem)
  dados_customizados Json?
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@unique([cliente_id, empresa_id])
  @@map("cliente_empresa")
}

// =====================================================
// PRODUTOS (Cadastro Centralizado)
// =====================================================
model Produto {
  id          String  @id @default(uuid())
  
  // Dados básicos
  codigo      String  @unique  // Código interno ERP
  descricao   String
  descricao_complementar String?
  
  // Classificação fiscal
  ncm         String
  cest        String?
  cfop        String?  // Código CFOP padrão
  unidade     String
  
  // Preço base (pode ser sobrescrito por empresa)
  preco_base  Decimal? @db.Decimal(15, 2)
  
  // Tipo
  tipo        String   @default("PRODUTO") // PRODUTO, SERVICO, KIT
  
  // Status
  ativo       Boolean  @default(true)
  
  // Relacionamentos
  produtoEmpresas ProdutoEmpresa[]
  pedidoItens     PedidoItem[]
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("produtos")
}

// =====================================================
// PRODUTO_EMPRESA (Mapeamento Produto → Omie por Empresa)
// =====================================================
model ProdutoEmpresa {
  id     String @id @default(uuid())
  
  // Relacionamentos
  produto_id  String
  produto     Produto @relation(fields: [produto_id], references: [id], onDelete: Cascade)
  
  empresa_id  String
  empresa     Empresa @relation(fields: [empresa_id], references: [id], onDelete: Cascade)
  
  // Código do produto no Omie desta empresa
  codigo_omie String
  
  // Estoque
  estoque_minimo   Int      @default(0)
  estoque_atual    Int      @default(0)
  estoque_reservado Int     @default(0)
  ultima_consulta  DateTime?
  
  // Preço específico da empresa
  preco_venda      Decimal? @db.Decimal(15, 2)
  
  // Configurações fiscais específicas
  config_fiscal    Json?
  
  // Campos específicos do Omie
  dados_omie       Json?
  
  // Relacionamentos inversos
  pedidoItens      PedidoItem[]
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@unique([produto_id, empresa_id])
  @@map("produto_empresa")
}

// =====================================================
// PEDIDOS (Mestre - Unificado)
// =====================================================
model Pedido {
  id     String @id @default(uuid())
  
  // Número interno do ERP
  numero        String   @unique
  
  // Cliente
  cliente_id    String
  cliente       Cliente  @relation(fields: [cliente_id], references: [id])
  
  // Status
  status        String   @default("RASCUNHO") // RASCUNHO, VALIDADO, PROCESSANDO, VALIDADO, FATURANDO, CONCLUIDO, CANCELADO
  substatus     String?  // Detalhamento do status
  
  // Valores
  valor_produtos Decimal  @db.Decimal(15, 2)
  valor_desconto Decimal  @default(0) @db.Decimal(15, 2)
  valor_frete    Decimal  @default(0) @db.Decimal(15, 2)
  valor_total    Decimal  @db.Decimal(15, 2)
  
  // Entrega
  endereco_entrega Json?
  data_previsao DateTime?
  
  // Pagamento
  forma_pagamento String?
  condicao_pagamento String?
  
  // Observações
  observacoes    String?
  observacao_interna String?
  
  // Usuário que criou
  usuario_id     String?
  
  // Relacionamentos
  itens          PedidoItem[]
  pedidoEmpresas PedidoEmpresa[]
  notasFiscais   NotaFiscal[]
  
  // Controle de processamento
  processado_at  DateTime?
  faturado_at    DateTime?
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("pedidos")
}

// =====================================================
// PEDIDO_ITENS (Itens do Pedido Unificado)
// =====================================================
model PedidoItem {
  id     String @id @default(uuid())
  
  // Pedido
  pedido_id   String
  pedido      Pedido  @relation(fields: [pedido_id], references: [id], onDelete: Cascade)
  
  // Produto
  produto_id  String
  produto     Produto @relation(fields: [produto_id], references: [id])
  
  // Empresa que fornecerá (CNPJ)
  empresa_id  String
  produtoEmpresa ProdutoEmpresa @relation(fields: [produto_id, empresa_id], references: [produto_id, empresa_id])
  
  // Quantidade e valores
  quantidade     Decimal  @db.Decimal(15, 3)
  preco_unitario Decimal  @db.Decimal(15, 4)
  valor_total    Decimal  @db.Decimal(15, 2)
  
  // Desconto
  percentual_desconto Decimal @default(0)
  valor_desconto      Decimal @default(0) @db.Decimal(15, 2)
  
  // Sequencial
  sequencia      Int
  
  // Dados fiscais (copiados do produto no momento da venda)
  ncm            String?
  cfop           String?
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("pedido_itens")
}

// =====================================================
// PEDIDO_EMPRESA (Pedidos criados em cada Omie)
// =====================================================
model PedidoEmpresa {
  id     String @id @default(uuid())
  
  // Pedido mestre
  pedido_id   String
  pedido      Pedido  @relation(fields: [pedido_id], references: [id], onDelete: Cascade)
  
  // Empresa
  empresa_id  String
  empresa     Empresa @relation(fields: [empresa_id], references: [id])
  
  // Referências no Omie
  codigo_pedido_omie String? // ID interno do Omie
  numero_pedido_omie String? // Número do pedido (ex: "001234")
  
  // Status no Omie
  status_omie    String? // PENDENTE, FATURADO, CANCELADO, etc.
  
  // Valores (para conferência)
  valor_itens    Decimal? @db.Decimal(15, 2)
  valor_total    Decimal? @db.Decimal(15, 2)
  
  // Resposta completa do Omie
  resposta_omie  Json?
  
  // Tentativas de criação
  tentativas     Int      @default(0)
  ultimo_erro    String?
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@unique([pedido_id, empresa_id])
  @@map("pedido_empresa")
}

// =====================================================
// NOTAS FISCAIS (NF-e emitidas)
// =====================================================
model NotaFiscal {
  id     String @id @default(uuid())
  
  // Pedido
  pedido_id   String
  pedido      Pedido  @relation(fields: [pedido_id], references: [id], onDelete: Cascade)
  
  // Empresa que emitiu
  empresa_id  String
  empresa     Empresa @relation(fields: [empresa_id], references: [id])
  
  // Dados da NF-e
  numero      String
  serie       String   @default("1")
  chave_acesso String   @unique
  protocolo   String?
  
  // Datas
  data_emissao DateTime @default(now())
  data_saida   DateTime?
  
  // Valores
  valor_produtos Decimal @db.Decimal(15, 2)
  valor_desconto Decimal @db.Decimal(15, 2)
  valor_total    Decimal @db.Decimal(15, 2)
  
  // URLs dos documentos
  xml_url     String?
  pdf_url     String?
  
  // Status
  status      String   @default("EMITIDA") // EMITIDA, CANCELADA, INUTILIZADA
  
  // Motivo de cancelamento
  motivo_cancelamento String?
  
  // Resposta completa do Omie
  dados_omie  Json?
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("notas_fiscais")
}

// =====================================================
// SINCRONIZACOES (Log de sincronizações com Omie)
// =====================================================
model Sincronizacao {
  id          String   @id @default(uuid())
  
  // Tipo de entidade
  tipo        String   // CLIENTE, PRODUTO, PEDIDO, etc.
  entidade_id String
  
  // Empresa destino
  empresa_id  String?
  
  // Ação
  acao        String   // CREATE, UPDATE, DELETE
  
  // Status
  status      String   @default("PENDING") // PENDING, SUCCESS, ERROR
  
  // Dados
  payload     Json?    // Dados enviados
  resposta    Json?    // Resposta recebida
  
  // Erro
  erro        String?
  tentativas  Int      @default(0)
  
  // Timestamps
  scheduled_at DateTime @default(now())
  executed_at  DateTime?
  completed_at DateTime?
  
  created_at DateTime @default(now())

  @@map("sincronizacoes")
}

// =====================================================
// AUDITORIA (Log de todas as operações)
// =====================================================
model Auditoria {
  id          String   @id @default(uuid())
  
  // Entidade afetada
  entidade    String   // nome da tabela/entidade
  entidade_id String
  
  // Ação
  acao        String   // CREATE, UPDATE, DELETE, SYNC, etc.
  
  // Dados
  dados_anteriores Json? // antes da alteração
  dados_novos      Json? // após a alteração
  
  // Contexto
  usuario_id  String?
  ip_address  String?
  user_agent  String?
  
  // Origem
  origem      String?  // WEB, API, JOB, WEBHOOK
  
  created_at DateTime @default(now())

  @@index([entidade, entidade_id])
  @@index([created_at])
  @@map("auditoria")
}
```

## Tipos TypeScript (Entidades de Domínio)

```typescript
// src/entities/Empresa.ts
export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  nomeFantasia?: string;
  appKey: string;
  appSecret: string; // Encriptado
  ativa: boolean;
  configuracoes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// src/entities/Cliente.ts
export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: Endereco;
  dadosFiscais?: DadosFiscais;
  codigosOmie: Map<string, string>; // empresaId -> codigoOmie
  createdAt: Date;
  updatedAt: Date;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  codigoPais: string;
}

export interface DadosFiscais {
  ie?: string;
  im?: string;
  tipoContribuinte: '1' | '2' | '9';
}

// src/entities/Produto.ts
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
  estoques: Map<string, ProdutoEmpresa>; // empresaId -> dados
  createdAt: Date;
  updatedAt: Date;
}

export interface ProdutoEmpresa {
  empresaId: string;
  codigoOmie: string;
  estoqueMinimo: number;
  estoqueAtual: number;
  estoqueReservado: number;
  ultimaConsulta?: Date;
  precoVenda?: number;
  configFiscal?: Record<string, any>;
}

// src/entities/Pedido.ts
export type PedidoStatus = 
  | 'RASCUNHO' 
  | 'VALIDADO' 
  | 'PROCESSANDO' 
  | 'VALIDADO' 
  | 'FATURANDO' 
  | 'CONCLUIDO' 
  | 'CANCELADO';

export interface Pedido {
  id: string;
  numero: string;
  clienteId: string;
  cliente: Cliente;
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
  pedidosEmpresa: PedidoEmpresa[];
  notasFiscais: NotaFiscal[];
  processadoAt?: Date;
  faturadoAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PedidoItem {
  id: string;
  pedidoId: string;
  produtoId: string;
  produto: Produto;
  empresaId: string;
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
  empresa: Empresa;
  codigoPedidoOmie?: string;
  numeroPedidoOmie?: string;
  statusOmie?: string;
  valorItens?: number;
  valorTotal?: number;
  respostaOmie?: Record<string, any>;
  tentativas: number;
  ultimoErro?: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/entities/NotaFiscal.ts
export type NotaFiscalStatus = 'EMITIDA' | 'CANCELADA' | 'INUTILIZADA';

export interface NotaFiscal {
  id: string;
  pedidoId: string;
  empresaId: string;
  empresa: Empresa;
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
  dadosOmie?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
}

export enum PedidoOmieStatus {
  PENDENTE = 'PENDENTE',
  FATURADO = 'FATURADO',
  CANCELADO = 'CANCELADO',
  NAO_PROCESSADO = 'NAO_PROCESSADO'
}
```

## DTOs (Data Transfer Objects)

```typescript
// src/dto/CreatePedidoDTO.ts
export interface CreatePedidoDTO {
  clienteId: string;
  enderecoEntrega?: EnderecoDTO;
  observacoes?: string;
  observacaoInterna?: string;
  formaPagamento: string;
  condicaoPagamento?: string;
  dataPrevisao?: Date;
  itens: CreatePedidoItemDTO[];
}

export interface CreatePedidoItemDTO {
  produtoId: string;
  quantidade: number;
  precoUnitario?: number; // Opcional, usa preço cadastrado se não informado
  percentualDesconto?: number;
}

// src/dto/UpdatePedidoDTO.ts
export interface UpdatePedidoDTO {
  observacoes?: string;
  observacaoInterna?: string;
  enderecoEntrega?: EnderecoDTO;
  dataPrevisao?: Date;
}

// src/dto/PedidoResponseDTO.ts
export interface PedidoResponseDTO {
  id: string;
  numero: string;
  cliente: ClienteResumoDTO;
  status: PedidoStatus;
  valores: {
    produtos: number;
    desconto: number;
    frete: number;
    total: number;
  };
  empresasEnvolvidas: PedidoEmpresaResumoDTO[];
  itens: PedidoItemResponseDTO[];
  notasFiscais: NotaFiscalResumoDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClienteResumoDTO {
  id: string;
  nome: string;
  cpfCnpj: string;
}

export interface PedidoEmpresaResumoDTO {
  empresaId: string;
  empresaNome: string;
  cnpj: string;
  numeroPedidoOmie?: string;
  status: string;
  valor: number;
}

export interface PedidoItemResponseDTO {
  sequencia: number;
  produto: {
    id: string;
    codigo: string;
    descricao: string;
  };
  empresa: {
    id: string;
    nome: string;
  };
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
}

export interface NotaFiscalResumoDTO {
  numero: string;
  serie: string;
  chaveAcesso: string;
  empresaNome: string;
  valor: number;
  status: string;
  pdfUrl?: string;
}
```
