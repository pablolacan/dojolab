#!/bin/sh
# docker-entrypoint.sh
# Script para configurar variables de entorno dinámicas en runtime

set -e

# Función para logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Iniciando configuración del contenedor..."

# Configurar variables de entorno por defecto si no están definidas
export VITE_DIRECTUS_URL=${VITE_DIRECTUS_URL:-"https://api.thedojolab.com"}
export VITE_APP_NAME=${VITE_APP_NAME:-"The Dojo Lab Dashboard"}
export VITE_APP_VERSION=${VITE_APP_VERSION:-"1.0.0"}
export VITE_DEV_MODE=${VITE_DEV_MODE:-"false"}
export VITE_MAINTENANCE_ALLOWED_IPS=${VITE_MAINTENANCE_ALLOWED_IPS:-"127.0.0.1,localhost"}

log "Variables de entorno configuradas:"
log "- VITE_DIRECTUS_URL: $VITE_DIRECTUS_URL"
log "- VITE_APP_NAME: $VITE_APP_NAME"
log "- VITE_APP_VERSION: $VITE_APP_VERSION"
log "- VITE_DEV_MODE: $VITE_DEV_MODE"
log "- VITE_MAINTENANCE_ALLOWED_IPS: $VITE_MAINTENANCE_ALLOWED_IPS"

# Crear directorio de configuración si no existe
mkdir -p /app/dist/config

# Crear archivo de configuración JavaScript que será incluido en index.html
cat > /app/dist/config/env.js << EOF
// Configuración de variables de entorno para runtime
window.__ENV__ = {
  VITE_DIRECTUS_URL: '$VITE_DIRECTUS_URL',
  VITE_APP_NAME: '$VITE_APP_NAME',
  VITE_APP_VERSION: '$VITE_APP_VERSION',
  VITE_DEV_MODE: '$VITE_DEV_MODE',
  VITE_MAINTENANCE_ALLOWED_IPS: '$VITE_MAINTENANCE_ALLOWED_IPS'
};
EOF

log "Archivo de configuración runtime creado"

# Modificar index.html para incluir la configuración
if [ -f "/app/dist/index.html" ]; then
    # Buscar si ya existe la línea de configuración
    if ! grep -q "config/env.js" /app/dist/index.html; then
        # Insertar script antes del cierre de </head>
        sed -i 's|</head>|  <script src="/config/env.js"></script>\n  </head>|g' /app/dist/index.html
        log "Script de configuración agregado a index.html"
    else
        log "Script de configuración ya existe en index.html"
    fi
else
    log "ADVERTENCIA: index.html no encontrado"
fi

# Verificar que los archivos estáticos existen
if [ ! -f "/app/dist/index.html" ]; then
    log "ERROR: index.html no encontrado en /app/dist/"
    exit 1
fi

# Mostrar información del contenedor
log "Información del contenedor:"
log "- Node.js version: $(node --version)"
log "- Serve package: $(serve --version)"
log "- Archivos en /app/dist: $(ls -la /app/dist/ | wc -l) archivos"

log "Iniciando servidor..."

# Ejecutar el comando original (serve)
exec "$@"