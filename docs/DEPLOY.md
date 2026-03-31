# Guia de Deploy - MultiOmie ERP

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Conta Omie API (app_key e app_secret por empresa)

## Configuração de Ambiente

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite as seguintes variáveis:

```env
# Environment
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/multiomie?schema=public"

# Redis (para filas e cache)
REDIS_URL="redis://localhost:6379"

# JWT (gerar chaves fortes para produção)
JWT_SECRET="sua-chave-jwt-super-segura-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption (AES-256 - exatamente 32 caracteres)
ENCRYPTION_KEY="sua-chave-32-chars-criptografia!!"

# Omie API Rate Limiting
OMIE_RATE_LIMIT_REQUESTS=60
OMIE_RATE_LIMIT_WINDOW=60000

# Logging
LOG_LEVEL="info"
LOG_PRETTY=false

# Workers
ENABLE_WORKERS=true
```

### 2. Banco de Dados

Execute as migrações:

```bash
npm run db:migrate
```

Gere o cliente Prisma:

```bash
npm run db:generate
```

### 3. Build

Instale dependências:

```bash
npm install
```

Build do projeto:

```bash
npm run build
```

## Deploy com Docker

### Docker Compose (Recomendado)

Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:senha@db:5432/multiomie
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=senha
      - POSTGRES_DB=multiomie
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Execute:

```bash
docker-compose up -d
```

### Dockerfile

Crie um `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instala dependências de build
RUN apk add --no-cache python3 make g++

# Copia arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN npm ci

# Gera cliente Prisma
RUN npx prisma generate

# Copia código fonte
COPY . .

# Build
RUN npm run build

# Remove dependências de desenvolvimento
RUN npm prune --production

# Usuário não-root
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

## Deploy em Serviços Cloud

### Railway/Render/Heroku

1. Configure as variáveis de ambiente no dashboard
2. Adicione o banco PostgreSQL como add-on
3. Adicione o Redis como add-on
4. Deploy automático via Git

### VPS (DigitalOcean, AWS EC2, etc)

1. Instale Node.js 20+:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Instale PostgreSQL:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

3. Instale Redis:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

4. Clone o projeto e configure:
```bash
git clone <repo>
cd multiomie
npm install
cp .env.example .env
# Edite .env
npm run db:migrate
npm run build
```

5. Use PM2 para gerenciar o processo:
```bash
npm install -g pm2
pm2 start dist/server.js --name multiomie
pm2 startup
pm2 save
```

## Configuração de Webhooks Omie

Configure os webhooks no painel da Omie para apontar para:

```
https://seu-dominio.com/api/webhooks/nfe/emitida
https://seu-dominio.com/api/webhooks/pedido/faturado
```

## SSL/TLS (HTTPS)

### Usando Nginx como Reverse Proxy

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoramento

### Health Check

Verifique a saúde da aplicação em:

```
GET /health
GET /api/dashboard/system-status
```

### Logs

Em produção, configure o envio de logs para serviços como:
- Datadog
- Loggly
- Papertrail
- ELK Stack

## Backup

### Banco de Dados

Automatize backups diários:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
gzip backup_$DATE.sql
# Envie para S3 ou outro storage
```

### Redis

Configure persistência no Redis:

```conf
save 900 1
save 300 10
save 60 10000
appendonly yes
```

## Atualização

1. Faça backup do banco
2. Puxe as alterações:
```bash
git pull origin main
```
3. Instale dependências:
```bash
npm install
```
4. Execute migrações:
```bash
npm run db:migrate
```
5. Rebuild:
```bash
npm run build
```
6. Restart:
```bash
pm2 restart multiomie
```

## Troubleshooting

### Erro de conexão com Omie

- Verifique app_key e app_secret
- Confirme que a empresa está ativa no Omie
- Verifique rate limiting

### Fila não processa

- Verifique conexão com Redis
- Reinicie os workers: `ENABLE_WORKERS=true npm start`
- Verifique logs: `pm2 logs`

### Erros de banco

- Verifique migrations pendentes: `npx prisma migrate status`
- Reset (cuidado!): `npx prisma migrate reset`

## Suporte

Em caso de problemas, verifique:
1. Logs da aplicação
2. Métricas em `/api/dashboard/system-status`
3. Status das integrações em `/api/dashboard/integracao`
