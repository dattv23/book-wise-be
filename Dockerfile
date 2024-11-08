FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies and generate Prisma client
RUN npm install && \
    npx prisma generate

# Copy application files and Prisma schema
COPY . .

# Create necessary directories for logs
RUN mkdir -p ${LOG_FOLDER} && \
    chown -R node:node .

EXPOSE ${PORT}

USER node

CMD ["npm", "start"]