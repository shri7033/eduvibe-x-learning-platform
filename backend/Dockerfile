# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine

# Install production dependencies
RUN apk add --no-cache tini

# Create app directory
WORKDIR /app

# Copy built assets from build stage
COPY --from=build /app ./

# Create non-root user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["npm", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -qO- http://localhost:5000/health || exit 1

# Add labels
LABEL maintainer="EDUVIBE-X Team"
LABEL version="1.0"
LABEL description="EDUVIBE-X Backend API"

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Add volumes
VOLUME ["/app/logs", "/app/uploads"]

# Add metadata
LABEL org.opencontainers.image.source="https://github.com/eduvibex/backend"
LABEL org.opencontainers.image.licenses="MIT"

# Security
RUN npm audit fix

# Optimize for production
RUN npm cache clean --force && \
    rm -rf /tmp/* && \
    rm -rf ~/.npm

# Set Node.js options
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Configure process manager
ENV PM2_HOME="/app/.pm2"

# Set up error handling
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error

# Configure logging
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json

# Set up monitoring
ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true

# Configure clustering
ENV CLUSTER_MODE=true
ENV WORKERS=auto

# Set up security headers
ENV SECURITY_HEADERS=true
ENV CORS_ENABLED=true

# Configure rate limiting
ENV RATE_LIMIT_WINDOW=15
ENV RATE_LIMIT_MAX=100

# Set up compression
ENV COMPRESSION_ENABLED=true
ENV COMPRESSION_LEVEL=6

# Configure caching
ENV CACHE_ENABLED=true
ENV CACHE_TTL=3600

# Set up monitoring
ENV METRICS_ENABLED=true
ENV TRACING_ENABLED=true

# Start the application with PM2
CMD ["npm", "run", "start:prod"]
