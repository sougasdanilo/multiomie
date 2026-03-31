# Migração para Supabase

Este documento descreve o processo de migração do projeto Multiomie ERP de Prisma/PostgreSQL para Supabase.

## O que foi alterado

### 1. Dependências
- ✅ Removido: `@prisma/client` e `prisma`
- ✅ Adicionado: `@supabase/supabase-js`

### 2. Configuração
- ✅ Criado: `src/config/supabase.ts` - Configuração do cliente Supabase
- ✅ Atualizado: `src/config/database.ts` - Agora usa Supabase
- ✅ Atualizado: `.env.example` - Novas variáveis do Supabase

### 3. Schema
- ✅ Criado: `supabase/schema.sql` - Schema SQL completo para Supabase
- ✅ Mantido: `prisma/schema.prisma` - Para referência (pode ser removido)

### 4. Scripts
- ✅ Atualizado: `package.json` - Scripts do banco agora usam Supabase
- ✅ Criado: `scripts/seed.ts` - Seed script para Supabase

## Próximos Passos

### 1. Criar projeto Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - Project URL
   - Anon Key
   - Service Role Key

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 3. Configurar banco de dados
Execute o schema SQL no Supabase:

```bash
# Via SQL Editor do Dashboard Supabase
# Copie e cole o conteúdo de supabase/schema.sql
```

### 4. Instalar dependências
```bash
npm install
```

### 5. Executar seed (opcional)
```bash
npm run db:seed
```

### 6. Testar aplicação
```bash
npm run dev
```

## Mudanças nos Controllers

Os controllers precisarão ser atualizados para usar a sintaxe do Supabase. Exemplo:

### Antes (Prisma)
```typescript
const empresas = await prisma.empresa.findMany({
  where: { ativa: true }
});
```

### Depois (Supabase)
```typescript
const { data: empresas, error } = await supabase
  .from('empresas')
  .select('*')
  .eq('ativa', true);

if (error) throw error;
```

## Vantagens da Migração

1. **Gerenciamento simplificado**: Supabase cuida do banco, auth, storage, etc.
2. **Realtime**: Suporte nativo a WebSocket para atualizações em tempo real
3. **Auth integrado**: Sistema de autenticação pronto para uso
4. **Storage**: Armazenamento de arquivos integrado
5. **Edge Functions**: Serverless functions quando necessário
6. **Dashboard**: Interface web para gerenciamento

## Considerações

1. **Performance**: Supabase pode ter latência adicional comparado a PostgreSQL local
2. **Limites**: Verifique os limites do plano gratuito do Supabase
3. **Segurança**: Configure as Row Level Security (RLS) adequadamente
4. **Backup**: Supabase oferece backups automáticos

## Arquivos que podem ser removidos
- `prisma/` (diretório inteiro)
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/`

## Comandos úteis
```bash
# Instalar CLI do Supabase (opcional)
npm install -g supabase

# Login
supabase login

# Link com projeto
supabase link --project-ref your-project-ref

# Push schema
supabase db push

# Gerar types
supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```
