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
