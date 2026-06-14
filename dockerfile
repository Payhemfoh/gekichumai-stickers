# =========================================================
# STAGE 1: Build the React Frontend (Heavy tools allowed)
# =========================================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
# Use the legacy peer deps flag you need, but skip documentation/caches
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
RUN touch /app/frontend-done.txt

# =========================================================
# STAGE 2: Build the Backend Production Dependencies
# =========================================================
FROM node:18-alpine AS backend-builder
WORKDIR /app

COPY --from=frontend-builder /app/frontend-done.txt ./

COPY package*.json ./
# Strictly install production dependencies only (ignores devDependencies)
RUN npm edit-production-deps || npm json-minify || true 
RUN npm ci --only=production --legacy-peer-deps

# =========================================================
# STAGE 3: The Final Lightweight, Distroless Runtime
# =========================================================
FROM gcr.io/distroless/nodejs18-debian12
WORKDIR /app

# Copy production backend dependencies from Stage 2
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# Copy only the compiled source code files needed to run the server
COPY server/ ./server/

# Copy the compiled static React build from Stage 1
COPY --from=frontend-builder /app/build ./build

# Expose only the backend port (Nginx handles port 80 externally via Compose)
EXPOSE 8080

# Run the Node application directly without a shell interpreter
CMD ["node", "server/index.js"]