FROM node:22-alpine
WORKDIR /app

# Copy workspace manifests first — better layer caching for npm install
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/

# --ignore-scripts avoids Expo/React Native postinstall hooks that fail in Alpine
RUN npm ci --ignore-scripts

# Copy Prisma schema + migrations
COPY prisma/ ./prisma/

# Copy application source (only what the API needs at runtime)
COPY packages/shared/src/ ./packages/shared/src/
COPY apps/api/src/ ./apps/api/src/

# Generate Prisma client from schema
RUN node_modules/.bin/prisma generate

ENV NODE_ENV=production

# Railway injects PORT automatically; the API already reads process.env.PORT
EXPOSE 3333

# Run pending DB migrations, then start the API
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node --import tsx apps/api/src/index.ts"]
