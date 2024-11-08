# Use the official Node.js LTS (Long Term Support) image with Alpine for a lightweight build environment
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock (if available) to leverage Docker cache for dependency installation
COPY package.json ./

# Copy .env file to make sure environment variables are available
COPY .env .env

# Copy the prisma directory to ensure the schema file is available
COPY prisma ./prisma

# Install dependencies listed in package.json
RUN yarn

# Push the database schema to the database (assumes a tool like Prisma)
RUN yarn db:push

# Copy the entire project into the working directory in the container
COPY . .

# Build the application (e.g., transpile TypeScript or compile assets if needed)
RUN yarn build

# Expose port 8080 to allow external access to the application
EXPOSE 8080

# Command to run the application
CMD ["yarn", "start"]
