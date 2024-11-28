FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 3333

CMD ["yarn", "dev"]
