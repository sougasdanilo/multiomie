# MultiOmie ERP - Sistema Multi-CNPJ com Integração Omie

## Visão Geral

Sistema ERP Node.js para gestão multi-empresa (multi-CNPJ) integrado à API do Omie, permitindo:
- **Múltiplas empresas**: Cada CNPJ com estoque independente no Omie
- **Clientes unificados**: Cadastro centralizado com sincronização automática entre empresas
- **Pedidos multi-estoque**: Interface única para pedidos com produtos de diferentes empresas
- **Faturamento inteligente**: Separação automática de pedidos por CNPJ/origem
- **Emissão de NF-e**: Integração completa com emissão de notas fiscais
- **Processamento síncrono**: Operações diretas sem dependência de filas
- **Dashboard em tempo real**: Monitoramento de integrações e métricas

## Índice

1. [Arquitetura da Solução](./docs/ARQUITETURA.md)
2. [Fluxo do Pedido](./docs/FLUXO_PEDIDO.md)
3. [Modelo de Dados](./docs/MODELO_DADOS.md)
4. [Integração Omie API](./docs/OMIE_INTEGRACAO.md)
5. [Guia de Deploy](./docs/DEPLOY.md)
6. [Código Fonte](./src/)

## Tecnologias

- **Backend**: Node.js 20+ + Express + TypeScript
- **Banco de Dados**: PostgreSQL 14+ (dados transacionais)
- **ORM**: Prisma
- **Validação**: Zod
- **HTTP Client**: Axios com Circuit Breaker (opossum)
- **Logger**: Pino
- **Autenticação**: JWT

## Estrutura do Projeto

```
multiomie/
├── src/
│   ├── config/         # Configurações (DB)
│   ├── controllers/    # HTTP controllers
│   ├── entities/       # Entidades de domínio (TypeScript interfaces)
│   ├── integrations/   # Integração Omie API + Circuit Breaker
│   ├── jobs/           # Processamento (simplificado, sem filas)
│   ├── middlewares/    # Middlewares HTTP (auth, validation, logger)
│   ├── routes/         # Rotas da API
│   ├── schemas/        # Schemas de validação Zod
│   ├── services/       # Lógica de negócio
│   └── utils/          # Utilitários (encryption)
├── docs/               # Documentação
├── prisma/             # Schema Prisma + migrações + seed
└── frontend/           # Frontend React (em desenvolvimento)
```

## Funcionalidades Principais

### 1. Gestão de Empresas (Multi-CNPJ)
- CRUD completo de empresas
- Cada empresa com suas próprias credenciais Omie (app_key, app_secret)
- Criptografia AES-256 das credenciais
- Teste de conexão com API Omie
- Estatísticas por empresa (clientes, produtos, pedidos, NF-es)

### 2. Cadastro Unificado de Clientes
- Cliente cadastrado uma única vez no ERP
- Sincronização automática para todas as empresas no Omie
- Mapeamento de códigos de cliente por empresa
- Reprocessamento de sincronizações com erro

### 3. Produtos Multi-Empresa
- Catálogo centralizado de produtos
- Vínculo de produtos com múltiplas empresas
- Sincronização automática de produtos do Omie
- Consulta de estoque em tempo real (com cache)
- Reserva de estoque para pedidos

### 4. Pedidos Multi-Empresa
- Interface única para criação de pedidos
- Produtos de diferentes empresas em um único pedido
- Validação de estoque em cada empresa
- Processamento assíncrono (filas BullMQ)
- Faturamento e emissão de NF-e
- Compensação automática em caso de falha

### 5. Dashboard e Monitoramento
- Resumo do sistema (totais, pedidos por status)
- Status de integração com Omie por empresa
- Status dos Circuit Breakers
- Pedidos e notas fiscais recentes
- Health check do sistema

### 6. Webhooks
- Recebimento de eventos do Omie
- Atualização automática de status de NF-e
- Sincronização de pedidos faturados

## Quick Start

### Pré-requisitos
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd multiomie

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações
```

### Configuração do Banco de Dados

```bash
# Execute as migrações
npx prisma migrate dev

# Gere o cliente Prisma
npx prisma generate

# (Opcional) Popule com dados de teste
npx prisma db seed
```

### Iniciar o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000`

## API Endpoints

### Dashboard
- `GET /api/dashboard/resumo` - Resumo do sistema
- `GET /api/dashboard/integracao` - Status das integrações Omie
- `GET /api/dashboard/circuit-breakers` - Status dos circuit breakers
- `GET /api/dashboard/pedidos-recentes` - Pedidos recentes
- `GET /api/dashboard/notas-fiscais-recentes` - NF-es recentes
- `GET /api/dashboard/system-status` - Status do sistema

### Empresas
- `POST /api/empresas` - Criar empresa
- `GET /api/empresas` - Listar empresas
- `GET /api/empresas/:id` - Obter empresa
- `PUT /api/empresas/:id` - Atualizar empresa
- `DELETE /api/empresas/:id` - Desativar empresa
- `POST /api/empresas/:id/testar-conexao` - Testar conexão Omie
- `GET /api/empresas/:id/estatisticas` - Estatísticas da empresa

### Clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Obter cliente
- `GET /api/clientes/cpf-cnpj/:cpfCnpj` - Buscar por CPF/CNPJ
- `POST /api/clientes/reprocessar-sincronizacoes` - Reprocessar pendentes

### Produtos
- `POST /api/produtos/sincronizar/:empresaId` - Sincronizar produtos da empresa
- `GET /api/produtos/empresa/:empresaId` - Listar produtos da empresa
- `GET /api/produtos/:produtoId/estoque/:empresaId` - Consultar estoque

### Pedidos
- `POST /api/pedidos` - Criar pedido
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Obter pedido
- `POST /api/pedidos/:id/processar` - Processar pedido (cria no Omie)
- `POST /api/pedidos/:id/faturar` - Faturar pedido

### Sincronização (Assíncrona)
- `POST /api/sincronizacao/produtos/:empresaId` - Agendar sincronização de produtos
- `POST /api/sincronizacao/clientes` - Sincronizar clientes de todas empresas
- `POST /api/sincronizacao/estoque/:empresaId` - Atualizar estoque
- `POST /api/sincronizacao/pedidos/:pedidoId/processar` - Agendar processamento
- `POST /api/sincronizacao/pedidos/:pedidoId/faturar` - Agendar faturamento
- `GET /api/sincronizacao/status` - Status das filas

### Webhooks (Omie)
- `POST /api/webhooks/nfe/emitida` - NF-e emitida
- `POST /api/webhooks/pedido/faturado` - Pedido faturado

## Variáveis de Ambiente

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:senha@localhost:5432/multiomie?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (mínimo 32 caracteres)
JWT_SECRET="sua-chave-jwt-super-segura-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption (exatamente 32 caracteres)
ENCRYPTION_KEY="sua-chave-32-chars-criptografia!!"

# Omie API
OMIE_RATE_LIMIT_REQUESTS=60
OMIE_RATE_LIMIT_WINDOW=60000

# Logging
LOG_LEVEL="info"
LOG_PRETTY=true

# Workers
ENABLE_WORKERS=true
```

## Deploy

Veja o [Guia de Deploy](./docs/DEPLOY.md) para instruções detalhadas de deploy em:
- Docker / Docker Compose
- VPS (DigitalOcean, AWS EC2, etc)
- Plataformas Cloud (Railway, Render, Heroku)

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia com hot-reload (tsx)
npm run build            # Compila TypeScript
npm start                # Inicia servidor compilado

# Banco de Dados
npm run db:migrate       # Executa migrações
npm run db:generate      # Gera cliente Prisma
npm run db:studio        # Abre Prisma Studio
npm run db:seed          # Popula dados de teste

# Qualidade
npm run lint             # ESLint
npm run lint:fix         # ESLint com fix
npm run typecheck        # Verificação de tipos TypeScript

# Testes
npm run test             # Executa testes (Vitest)
npm run test:e2e         # Testes E2E
```

## Arquitetura de Integração

### Fluxo de Pedido Multi-Empresa

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Pedido    │────▶│  Separação  │────▶│   Pedido    │
│   Mestre    │     │  por Empresa│     │  Empresa A  │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                          ┌─────────────┐      │
                          │   Pedido    │◀─────┘
                          │  Empresa B  │
                          └─────────────┘
```

### Sincronização de Clientes

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│     ERP     │────▶│  Empresa A  │
│  Cadastrado │     │  Centralizado│    │   (Omie)    │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                          ┌─────────────┐      │
                          │  Empresa B  │◀─────┘
                          │   (Omie)    │
                          └─────────────┘
```

## Segurança

- ✅ Criptografia AES-256 das credenciais Omie
- ✅ JWT para autenticação
- ✅ Rate limiting por IP
- ✅ Helmet para headers de segurança
- ✅ CORS configurável
- ✅ Circuit Breaker para prevenção de falhas em cascata
- ✅ Validação de entrada com Zod
- ✅ SQL Injection protection (Prisma ORM)

## Monitoramento

### Health Checks
- `GET /health` - Health básico
- `GET /api/dashboard/system-status` - Status detalhado

### Logs
Logs estruturados em JSON (Pino):
- Request ID tracking
- Tempo de resposta
- Níveis: DEBUG, INFO, WARN, ERROR

## Contribuição

1. Faça fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

MIT

## Suporte

Para dúvidas ou problemas:
1. Verifique a documentação em `/docs`
2. Consulte os logs da aplicação
3. Verifique os health checks
4. Abra uma issue no repositório

---

**⚠️ Importante**: Este sistema integra-se com a API do Omie. É necessário ter uma conta ativa na Omie com permissões de API para cada empresa que deseja integrar.
