#!/bin/bash
# deploy.sh - Script para deploy en diferentes entornos

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Variables
ENVIRONMENT="${1:-development}"
DOCKER_TAG="${2:-latest}"
PROJECT_NAME="dojolab-frontend"

# Validar entorno
case $ENVIRONMENT in
    development|dev)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    production|prod)
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    *)
        error "Entorno inválido: $ENVIRONMENT. Usa: development, production"
        ;;
esac

log "Desplegando $PROJECT_NAME en entorno: $ENVIRONMENT"
log "Usando archivo: $COMPOSE_FILE"

# Verificar que el archivo compose existe
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Archivo $COMPOSE_FILE no encontrado"
fi

# Build de la imagen primero
log "Construyendo imagen..."
./build.sh "$DOCKER_TAG" "$ENVIRONMENT"

# Deploy con docker-compose
log "Desplegando con docker-compose..."

if [ "$ENVIRONMENT" = "production" ]; then
    # Producción: deploy con zero-downtime
    log "Ejecutando deploy de producción..."
    
    # Backup de la configuración actual
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log "Creando backup de la configuración actual..."
        docker-compose -f "$COMPOSE_FILE" config > "backup-$(date +%Y%m%d-%H%M%S).yml"
    fi
    
    # Deploy
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    # Verificar que el servicio esté corriendo
    sleep 10
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        success "Deploy de producción completado"
    else
        error "Error en el deploy de producción"
    fi
    
else
    # Desarrollo: simple up
    log "Ejecutando deploy de desarrollo..."
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    if [ $? -eq 0 ]; then
        success "Deploy de desarrollo completado"
    else
        error "Error en el deploy de desarrollo"
    fi
fi

# Mostrar estado de los servicios
log "Estado de los servicios:"
docker-compose -f "$COMPOSE_FILE" ps

# Mostrar logs recientes
log "Logs recientes:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

# Health check
log "Ejecutando health check..."
sleep 5

# Verificar localhost (para ambos entornos)
if command -v wget &> /dev/null; then
    if wget --spider --quiet "http://localhost:3000/" 2>/dev/null; then
        success "Health check exitoso"
    else
        warning "Health check falló"
    fi
elif command -v curl &> /dev/null; then
    if curl -f "http://localhost:3000/" > /dev/null 2>&1; then
        success "Health check exitoso"
    else
        warning "Health check falló"
    fi
else
    warning "No se pudo ejecutar health check (wget/curl no disponibles)"
fi

# Información útil
echo ""
log "Información del deploy:"
echo "  URL: http://localhost:3000"

echo ""
log "Comandos útiles:"
echo "  Ver logs en tiempo real:"
echo "    docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "  Reiniciar servicios:"
echo "    docker-compose -f $COMPOSE_FILE restart"
echo ""
echo "  Parar servicios:"
echo "    docker-compose -f $COMPOSE_FILE down"
echo ""
echo "  Ver recursos utilizados:"
echo "    docker stats"

success "Deploy completado exitosamente en $ENVIRONMENT"#!/bin/bash
# deploy.sh - Script para deploy en diferentes entornos

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Variables
ENVIRONMENT="${1:-development}"
DOCKER_TAG="${2:-latest}"
PROJECT_NAME="dojolab-frontend"

# Validar entorno
case $ENVIRONMENT in
    development|dev)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    production|prod)
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    *)
        error "Entorno inválido: $ENVIRONMENT. Usa: development, production"
        ;;
esac

log "Desplegando $PROJECT_NAME en entorno: $ENVIRONMENT"
log "Usando archivo: $COMPOSE_FILE"

# Verificar que el archivo compose existe
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Archivo $COMPOSE_FILE no encontrado"
fi

# Build de la imagen primero
log "Construyendo imagen..."
./build.sh "$DOCKER_TAG" "$ENVIRONMENT"

# Deploy con docker-compose
log "Desplegando con docker-compose..."

if [ "$ENVIRONMENT" = "production" ]; then
    # Producción: deploy con zero-downtime
    log "Ejecutando deploy de producción..."
    
    # Backup de la configuración actual
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log "Creando backup de la configuración actual..."
        docker-compose -f "$COMPOSE_FILE" config > "backup-$(date +%Y%m%d-%H%M%S).yml"
    fi
    
    # Deploy
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    # Verificar que el servicio esté corriendo
    sleep 10
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        success "Deploy de producción completado"
    else
        error "Error en el deploy de producción"
    fi
    
else
    # Desarrollo: simple up
    log "Ejecutando deploy de desarrollo..."
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    if [ $? -eq 0 ]; then
        success "Deploy de desarrollo completado"
    else
        error "Error en el deploy de desarrollo"
    fi
fi

# Mostrar estado de los servicios
log "Estado de los servicios:"
docker-compose -f "$COMPOSE_FILE" ps

# Mostrar logs recientes
log "Logs recientes:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

# Health check
log "Ejecutando health check..."
sleep 5

if [ "$ENVIRONMENT" = "production" ]; then
    # En producción, verificar a través del dominio
    if command -v curl &> /dev/null; then
        if curl -f -k https://dashboard.thedojolab.com/health > /dev/null 2>&1; then
            success "Health check de producción exitoso"
        else
            warning "Health check de producción falló"
        fi
    fi
else
    # En desarrollo, verificar localhost
    if command -v curl &> /dev/null; then
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            success "Health check de desarrollo exitoso"
        else
            warning "Health check de desarrollo falló"
        fi
    fi
fi

# Información útil
echo ""
log "Información del deploy:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  URL: https://dashboard.thedojolab.com"
    echo "  Health: https://dashboard.thedojolab.com/health"
else
    echo "  URL: http://localhost:3000"
    echo "  Health: http://localhost:3000/health"
fi

echo ""
log "Comandos útiles:"
echo "  Ver logs en tiempo real:"
echo "    docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "  Reiniciar servicios:"
echo "    docker-compose -f $COMPOSE_FILE restart"
echo ""
echo "  Parar servicios:"
echo "    docker-compose -f $COMPOSE_FILE down"
echo ""
echo "  Ver recursos utilizados:"
echo "    docker stats"

success "Deploy completado exitosamente en $ENVIRONMENT"