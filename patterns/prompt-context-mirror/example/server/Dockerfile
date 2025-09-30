FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev # Instala solo dependencias de producción
COPY --from=builder /usr/src/app .

EXPOSE 3001

CMD ["node_modules/.bin/ts-node", "server.ts"]