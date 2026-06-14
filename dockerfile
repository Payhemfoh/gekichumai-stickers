# === STAGE 1: Build the React Frontend ===
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
RUN npm ci
COPY . .
RUN npm run build

# === STAGE 2: Run the Production Environment ===
FROM node:18-alpine
WORKDIR /app

# Install Nginx to serve the frontend static files
RUN apk add --no-cache nginx

# Copy backend dependencies and source code
COPY package*.json ./
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
RUN npm ci --only=production
COPY . .

# Copy the compiled React frontend from Stage 1 into Nginx's HTML directory
COPY --from=frontend-builder /app/build /var/www/html

# Copy our custom Nginx config inside the container
COPY nginx.conf /etc/nginx/nginx.conf

# Expose HTTP (80) and Backend (8080) ports internally
EXPOSE 80 8080

# Start both Nginx and the Node backend server
CMD nginx && node server/index.js