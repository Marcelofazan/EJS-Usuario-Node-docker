FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package files first to optimize Docker caching
COPY package*.json ./

# Install dependencies cleanly
RUN npm install --force

# Copy the rest of your application code
COPY . .

# Build your production assets/code
RUN npm run build

EXPOSE 3333

# Start the production server
CMD [ "npm", "start" ]