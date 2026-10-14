FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Multi-stage image com suporte a renderização de vídeo Remotion/Chromium
FROM node:20-alpine

# Instala Chromium e dependências para Puppeteer e Remotion no Alpine Linux
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      util-linux

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV REMOTION_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3333

CMD ["node", "src/server/server.js"]
