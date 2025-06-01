FROM python:3.10-slim

RUN apt-get update && \
    apt-get install -y build-essential && \
    apt-get clean

RUN pip install --upgrade pip && \
    pip install \
        numpy \
        pandas \
        scipy \
        scikit-learn \
        pymongo \
        weaviate-client \
        scikit-surprise

# Set working directory
WORKDIR /usr/app

# Copy dependencies and install
COPY package*.json ./
RUN yarn

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Copy rest of the project
COPY . .

# Build the project
RUN yarn build

# Expose app port
EXPOSE 8000

# Start command
CMD [ "yarn", "start" ]
