FROM node:20

WORKDIR /usr/app

COPY package*.json ./

RUN yarn

COPY prisma ./prisma

RUN npx prisma generate


COPY . .

RUN yarn build

EXPOSE 8000

CMD [ "yarn", "start" ]