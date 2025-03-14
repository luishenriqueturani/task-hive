# Usa a imagem do Node.js como base
FROM node:22-alpine AS base

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos do projeto para o container
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Compila o projeto TypeScript (se necessário)
RUN npm run build

# Define a variável de ambiente (opcional)
ENV DB_NAME=task_hive
ENV DB_USER=usuario_taskhive
ENV DB_PASSWORD="2]#Pe4?M1+50"
ENV DB_HOST=192.168.1.34
ENV DB_PORT=5432
ENV PORT=3333
ENV CRYPT_SAULT=10
ENV JWT_SECRET="dF#9xL7p@Yz8K!3rM*q$4NtWvJ%5G2hC"

# Expõe a porta da aplicação
EXPOSE 3333

# Comando para iniciar o NestJS
CMD ["npm", "run", "start:prod"]
