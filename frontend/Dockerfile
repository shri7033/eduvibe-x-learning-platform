# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files from build stage
COPY --from=build /app/public /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost/ || exit 1

# Add labels
LABEL maintainer="EDUVIBE-X Team"
LABEL version="1.0"
LABEL description="EDUVIBE-X Frontend"

# Environment variables
ENV NODE_ENV=production
ENV API_URL=http://api.eduvibex.com

# Set user
USER nginx

# Set working directory
WORKDIR /usr/share/nginx/html

# Add volumes
VOLUME ["/usr/share/nginx/html"]

# Add metadata
LABEL org.opencontainers.image.source="https://github.com/eduvibex/frontend"
LABEL org.opencontainers.image.licenses="MIT"

# Security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Optimize for production
RUN nginx -t && \
    rm -rf /var/cache/apk/* && \
    rm -rf /tmp/*

# Set default command
CMD ["nginx", "-g", "daemon off;"]
