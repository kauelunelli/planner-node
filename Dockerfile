# Etapa 1: Escolha a imagem base
FROM node:18-alpine as builder

# Etapa 2: Defina o diretório de trabalho
WORKDIR /app

# Etapa 3: Copie os arquivos da aplicação
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Etapa 4: Instale as dependências
RUN npm install


# Instale o Prisma CLI
RUN npm install -g prisma

RUN npx prisma generate

# Etapa 5: Compile o TypeScript
RUN npm run build

# Etapa 6: Preparação para a imagem de produção
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Instale apenas as dependências de produção
RUN npm install --only=production

# Etapa 7: Defina o comando de inicialização
CMD ["node", "dist/server.js"]