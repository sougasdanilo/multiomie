# Arquitetura da Solução ERP Multi-CNPJ

## Visão Arquitetural

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (Frontend)                             │
│                   (React/Vue - Interface Única)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Express)                            │
│  - Autenticação JWT │ Rate Limiting │ Validação │ Logging                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CAMADA DE SERVIÇOS (Node.js)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │   Cliente    │ │    Pedido    │ │   Empresa    │ │   Produto    │    │
│  │   Service    │ │   Service    │ │   Service    │ │   Service    │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │Sincronização │ │Faturamento   │ │  Auditoria   │                    │
│  │   Service    │ │   Service    │ │   Service    │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CAMADA DE INTEGRAÇÃO                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │ OmieClient   │ │  RetryEngine │ │ Webhook      │                    │
│  │ (API Omie)   │ │  (Exponential│ │ Handler      │                    │
│  │              │ │   Backoff)   │ │              │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      INFRAESTRUTURA DE DADOS                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │  PostgreSQL  │ │    Redis     │ │   BullMQ     │                    │
│  │ (Principal)  │ │   (Cache)    │ │   (Filas)    │                    │
│  │              │ │              │ │              │                    │
│  │ - Clientes   │ │ - Sessões    │ │ - Pedidos    │                    │
│  │ - Pedidos    │ │ - Locks      │ │ - Faturas    │                    │
│  │ - Empresas   │ │ - Rate Limit │ │ - Sync       │                    │
│  │ - Auditoria  │ │              │ │ - Retries    │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      API OMIE (Multi-Empresa)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │  Empresa A   │ │  Empresa B   │ │  Empresa C   │                    │
│  │  (CNPJ: X)   │ │  (CNPJ: Y)   │ │  (CNPJ: Z)   │                    │
│  │              │ │              │ │              │                    │
│  │ - Estoque    │ │ - Estoque    │ │ - Estoque    │                    │
│  │ - Pedidos    │ │ - Pedidos    │ │ - Pedidos    │                    │
│  │ - NF-es      │ │ - NF-es      │ │ - NF-es      │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. API Gateway (Express)
- **Responsabilidade**: Ponto de entrada único, segurança, rate limiting
- **Funcionalidades**:
  - Autenticação JWT
  - Validação de requisições (Zod)
  - Rate limiting por empresa/cliente
  - Request ID tracking
  - Logging estruturado (Pino)

### 2. Camada de Serviços
- **ClienteService**: Gerenciamento unificado de clientes
- **PedidoService**: Orquestração de pedidos multi-empresa
- **EmpresaService**: Gestão de CNPJs e credenciais Omie
- **ProdutoService**: Catálogo com mapeamento de estoque por empresa
- **SincronizacaoService**: Sync automática entre empresas
- **FaturamentoService**: Emissão de NF-e e controle de faturas
- **AuditoriaService**: Rastreamento de todas as operações

### 3. Camada de Integração
- **OmieClient**: Cliente HTTP configurado por empresa
- **RetryEngine**: Exponential backoff com jitter
- **CircuitBreaker**: Prevenção de cascata de falhas
- **WebhookHandler**: Recebimento de callbacks Omie

### 4. Infraestrutura de Filas (BullMQ)

```
Filas Principais:
├── pedidos:processar      → Processa pedido e separa por empresa
├── pedidos:criar_omie     → Cria pedido em cada empresa Omie
├── pedidos:faturar        → Faturamento e emissão NF-e
├── clientes:sync          → Sincronização de clientes entre CNPJs
├── omie:retry             → Retry de falhas na API Omie
└── webhook:processar      → Processa webhooks recebidos
```

### 5. Banco de Dados (PostgreSQL)

**Schema Principal**:
- `empresas`: Cadastro de CNPJs e credenciais Omie
- `clientes`: Cadastro unificado de clientes
- `cliente_empresa`: Mapeamento cliente → empresa no Omie
- `produtos`: Catálogo centralizado
- `produto_empresa`: Mapeamento produto → empresa + estoque
- `pedidos`: Pedidos mestre (unificados)
- `pedido_itens`: Itens do pedido com vínculo à empresa
- `pedido_empresa`: Pedidos criados em cada empresa Omie
- `notas_fiscais`: NF-es emitidas
- `sincronizacoes`: Log de sincronizações
- `auditoria`: Log de todas as operações

## Fluxo de Comunicação entre Empresas

```
┌─────────────────────────────────────────────────────────────────┐
│                    CADASTRO DE CLIENTE                          │
└─────────────────────────────────────────────────────────────────┘

[ERP] Cadastra Cliente João Silva (CPF: 123.456.789-00)
                    │
                    ▼
            ┌───────────────┐
            │  Cliente      │ ← Cliente unificado no ERP
            │  Centralizado │
            └───────┬───────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌───────┐      ┌───────┐      ┌───────┐
│Empresa│      │Empresa│      │Empresa│
│   A   │      │   B   │      │   C   │
└───┬───┘      └───┬───┘      └───┬───┘
    │              │              │
    ▼              ▼              ▼
[Código 12345] [Código 67890] [Código 11121]
    │              │              │
    └──────────────┴──────────────┘
                    │
            ┌───────────────┐
            │ Mapeamento    │
            │ ERP → Omie    │
            │ por Empresa   │
            └───────────────┘
```

## Padrões de Projeto Utilizados

### 1. Repository Pattern
```typescript
// Separação entre lógica de negócio e acesso a dados
interface IClienteRepository {
  create(data: CreateClienteDTO): Promise<Cliente>;
  findById(id: string): Promise<Cliente | null>;
  findByCpfCnpj(cpfCnpj: string): Promise<Cliente | null>;
  update(id: string, data: UpdateClienteDTO): Promise<Cliente>;
}
```

### 2. Service Layer
```typescript
// Lógica de negócio isolada
interface IClienteService {
  cadastrarCliente(dados: CadastroClienteDTO): Promise<Cliente>;
  sincronizarComEmpresas(clienteId: string): Promise<SincronizacaoResult[]>;
  obterCodigoOmie(clienteId: string, empresaId: string): Promise<string>;
}
```

### 3. Unit of Work
```typescript
// Transações atômicas
interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

### 4. Circuit Breaker
```typescript
// Prevenção de falhas em cascata
interface ICircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}
```

## Estratégia de Segurança

### 1. Credenciais Omie
- Armazenadas criptografadas (AES-256)
- Chave de criptografia em variável de ambiente
- Rotação periódica de chaves
- Nunca logadas ou expostas

### 2. Rate Limiting
- Por empresa: 100 req/min
- Por IP: 1000 req/min
- Fila Omie: Respeita limites da API (60 req/min por app)

### 3. Autenticação
- JWT com expiração curta (15 min)
- Refresh tokens (7 dias)
- RBAC (Role-Based Access Control)

## Escalabilidade

### 1. Horizontal Scaling
- Stateless API servers
- Redis para sessões compartilhadas
- PostgreSQL com read replicas

### 2. Processamento Assíncrono
- BullMQ para processamento em background
- Workers independentes para cada fila
- Auto-scaling baseado em tamanho da fila

### 3. Caching
- Redis para cache de produtos/estoque
- TTL baseado em criticidade dos dados
- Cache invalidation em atualizações

## Monitoramento

### 1. Métricas (Prometheus)
- Taxa de sucesso das integrações Omie
- Tempo de processamento de pedidos
- Tamanho das filas
- Erros por tipo

### 2. Logging (ELK Stack)
- Logs estruturados (JSON)
- Correlação por Request ID
- Níveis: DEBUG, INFO, WARN, ERROR

### 3. Alertas
- Falhas críticas na integração
- Filas com backlog alto
- Erros de rate limiting
