FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Multi-stage helps keep the image small if we had build steps. 
# For Node, we just copy everything over and ensure NODE_ENV is set.
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3333

CMD ["node", "src/server/server.js"]
