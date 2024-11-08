FROM node:lts-alpine
WORKDIR /usr/src/app

# first copy just the package and the lock file, for caching purposes
COPY package.json ./

# install dependencies
RUN yarn

# Push the database schema to the database (assumes a tool like Prisma)
RUN yarn db:push

# copy the entire project
COPY . .

# build
RUN yarn build

EXPOSE 8080
CMD [ "yarn", "start" ]

