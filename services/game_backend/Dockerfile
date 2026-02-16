FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (adjust as needed)
EXPOSE 7009

# Create volume for database persistence
VOLUME ["/app"]

# Start the server
CMD ["npm", "start"]
