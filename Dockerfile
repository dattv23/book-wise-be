FROM node:20

WORKDIR /usr/app

COPY package*.json ./

RUN yarn

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

EXPOSE 8000

CMD [ "yarn", "start" ]