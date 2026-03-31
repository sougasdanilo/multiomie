# Solução ERP Multi-CNPJ com Omie

## Visão Geral

Sistema ERP Node.js para gestão multi-empresa (multi-CNPJ) integrado à API do Omie, permitindo:
- **Múltiplas empresas**: Cada CNPJ com estoque independente no Omie
- **Clientes unificados**: Cadastro centralizado com sincronização automática entre empresas
- **Pedidos multi-estoque**: Interface única para pedidos com produtos de diferentes empresas
- **Faturamento inteligente**: Separação automática de pedidos por CNPJ/origem
- **Emissão de NF-e**: Integração completa com emissão de notas fiscais

## Índice

1. [Arquitetura da Solução](./docs/ARQUITETURA.md)
2. [Fluxo do Pedido](./docs/FLUXO_PEDIDO.md)
3. [Modelo de Dados](./docs/MODELO_DADOS.md)
4. [Estratégia de Sincronização](./docs/SINCRONIZACAO.md)
5. [Integração Omie API](./docs/OMIE_INTEGRACAO.md)
6. [Código Fonte](./src/)

## Tecnologias

- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (dados transacionais) + Redis (cache/fila)
- **Fila de Processamento**: BullMQ (Redis)
- **ORM**: Prisma
- **Validação**: Zod
- **HTTP Client**: Axios (Omie API)
- **Logger**: Pino

## Estrutura do Projeto

```
multiomie/
├── src/
│   ├── config/         # Configurações (Omie, DB, etc.)
│   ├── entities/       # Entidades de domínio
│   ├── services/       # Lógica de negócio
│   ├── controllers/    # HTTP controllers
│   ├── repositories/   # Acesso a dados
│   ├── integrations/   # Integração Omie API
│   ├── jobs/           # Processamento em background
│   ├── middlewares/    # Middlewares HTTP
│   └── utils/          # Utilitários
├── docs/               # Documentação
├── prisma/             # Schema Prisma
└── tests/              # Testes
```

## Configuração Rápida

```bash
# Instalação
npm install

# Configuração de variáveis de ambiente
cp .env.example .env
# Editar .env com credenciais Omie

# Migrações do banco
npx prisma migrate dev

# Iniciar servidor
dev
```

## Principais APIs do Omie Utilizadas

| Módulo | Endpoint | Descrição |
|--------|----------|-----------|
| Geral | `/geral/clientes/` | CRUD de clientes |
| Geral | `/geral/produtos/` | Consulta de produtos |
| Geral | `/geral/empresas/` | Dados da empresa |
| Produtos | `/produtos/pedido/` | Pedidos de venda |
| Produtos | `/produtos/pedidovendafat/` | Faturamento de pedidos |
| Produtos | `/produtos/nfe/` | Importar/emissão NF-e |
| Estoque | `/estoque/consulta/` | Consulta de estoque |
| Serviços | `/servicos/nfse/` | NFS-e |

## Funcionalidades Principais

### 1. Cadastro Unificado de Clientes
- Cliente cadastrado uma única vez no ERP
- Sincronização automática para todas as empresas no Omie
- Mapeamento de códigos de cliente por empresa

### 2. Pedidos Multi-Empresa
- Interface única para criação de pedidos
- Produtos podem vir de estoques de empresas diferentes
- Validação de estoque em cada empresa

### 3. Processamento Automático
- Separação de pedidos por empresa de origem
- Criação de pedidos individuais no Omie por CNPJ
- Faturamento automático e emissão de NF-e

### 4. Consistência de Dados
- Transações distribuídas com compensação
- Retry automático em falhas
- Auditoria completa de operações

## Licença

MIT
