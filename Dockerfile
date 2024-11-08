FROM node:20-alpine

WORKDIR /usr/app

# first copy just the package and the lock file, for caching purposes
COPY package.json ./

# install dependencies
RUN yarn

# copy the entire project
COPY . .

RUN yarn db:push

# build
RUN yarn build

EXPOSE 8000
CMD [ "yarn", "start" ]
