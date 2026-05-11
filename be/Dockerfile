FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3333

# Para rodar em modo desenvolvimento local com hot-reload, use: npm run dev
# Para rodar em produção (dentro do Docker), usa node diretamente
CMD ["npm", "start"]
