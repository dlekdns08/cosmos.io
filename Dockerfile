FROM node:20-slim AS deps

WORKDIR /app

# Build deps for better-sqlite3 native module
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ------------------------------------------------------------------------------
FROM deps AS build

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY server ./server
RUN npm run build

# ------------------------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

# Runtime build deps kept lean (better-sqlite3 already linked from deps stage)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY package.json tsconfig.json ./

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    COSMOS_DB=/data/cosmos.db

RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]
