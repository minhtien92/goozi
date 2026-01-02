FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for migrations)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]

