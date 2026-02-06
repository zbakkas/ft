# 1. Base Image
FROM node:20-alpine

# 2. Set Working Directory
WORKDIR /app

# 3. Install Dependencies
COPY package*.json ./
RUN npm install

# 4. Copy Source Code & Build
COPY . .
RUN npm run build

# 5. Copy standalone output and static files
RUN cp -r .next/static .next/standalone/.next/static
RUN cp -r public .next/standalone/public || true

WORKDIR /app/.next/standalone

# 6. Expose Port
EXPOSE 5000

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# 7. Start the App using standalone server
CMD ["node", "server.js"]