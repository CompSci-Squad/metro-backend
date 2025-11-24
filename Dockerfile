# Build stage
FROM node:18-alpine AS builder

LABEL maintainer="CompSci-Squad"
LABEL description="Construction Monitoring Backend - Build Stage"

# Install dependencies for Puppeteer and PostgreSQL client
RUN echo "📦 Instalando dependências de build..." && \
    apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    postgresql-client \
    curl \
    bash && \
    echo "✅ Dependências de build instaladas!"

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with detailed logging
RUN echo "📦 Instalando dependências npm..." && \
    npm install --omit=dev && \
    echo "✅ Dependências npm instaladas!" && \
    echo "📊 Total de pacotes: $(ls node_modules | wc -l)"

# Copy source code
COPY . .

RUN echo "✅ Build stage completo!"

# Production stage
FROM node:18-alpine

LABEL maintainer="CompSci-Squad"
LABEL description="Construction Monitoring Backend - Production"

# Install runtime dependencies
RUN echo "📦 Instalando dependências de produção..." && \
    apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    postgresql-client \
    curl \
    bash && \
    echo "✅ Dependências de produção instaladas!"

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts

# Tornar scripts executáveis
RUN chmod +x /app/scripts/*.sh && \
    echo "✅ Scripts configurados como executáveis"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    echo "✅ Usuário nodejs criado"

# Change ownership
RUN chown -R nodejs:nodejs /app && \
    echo "✅ Permissões configuradas"

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with wait script
CMD ["/bin/bash", "-c", "/app/scripts/wait-for-services.sh && npm start"]
