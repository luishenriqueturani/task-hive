# Build + dependências de produção (uma única npm ci no builder)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# `npm install` tolera lockfiles gerados por outras versões do npm; em CI/local podes usar `npm ci` se o lock estiver alinhado.
RUN npm install

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3001

ENV APP_PORT=3001

USER node

CMD ["node", "dist/main.js"]
