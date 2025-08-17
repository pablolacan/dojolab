# Dockerfile
# Multi-stage build para optimizar el tamaño final

# Stage 1: Build
FROM node:20-alpine AS builder

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci --silent

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Instalar serve globalmente para servir archivos estáticos
RUN npm install -g serve

# Crear directorio para la aplicación
WORKDIR /app

# Copiar archivos build desde el stage anterior
COPY --from=builder /app/dist ./dist

# Copiar script de entrypoint para variables de entorno dinámicas
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Usar entrypoint personalizado
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "3000"]