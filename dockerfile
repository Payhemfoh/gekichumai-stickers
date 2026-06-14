# =========================================================
# STAGE 1: Build the React Frontend (Sequential Throttling)
# =========================================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --progress=false
COPY . .
RUN npm run build
# Sequential execution anchor to protect server memory
RUN touch /app/frontend-done.txt

# =========================================================
# STAGE 2: Build the Backend Production Dependencies
# =========================================================
FROM node:18-alpine AS backend-builder
WORKDIR /app
# Wait for Stage 1 to complete before pulling packages
COPY --from=frontend-builder /app/frontend-done.txt ./
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# =========================================================
# STAGE 3: The Final Alpine Runtime (Clean & Transparent)
# =========================================================
FROM node:18-alpine
WORKDIR /app

# 1. Bring in production dependencies
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# 2. Bring in the server source directory structure
COPY server/ ./server/

# 3. Bring in the compiled React frontend static assets
COPY --from=frontend-builder /app/build ./build

# Set runtime environment flags
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Alpine has a native shell environment, so standard shortcuts resolve perfectly
CMD ["node", "server/index.js"]