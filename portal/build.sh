#!/bin/bash
# build.sh - Script para construir y deployar la aplicación

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Variables
PROJECT_NAME="dojolab-frontend"
DOCKER_IMAGE_NAME="dojolab-frontend"
DOCKER_TAG="${1:-latest}"
ENVIRONMENT="${2:-development}"

log "Iniciando build para $PROJECT_NAME"
log "Tag: $DOCKER_TAG"
log "Environment: $ENVIRONMENT"

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    error "Docker no está corriendo o no tienes permisos para usarlo"
fi

# Limpiar builds anteriores
log "Limpiando builds anteriores..."
docker system prune -f --filter "label=project=$PROJECT_NAME" || true

# Build de la imagen
log "Construyendo imagen Docker..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker build \
        --target production \
        --tag "$DOCKER_IMAGE_NAME:$DOCKER_TAG" \
        --tag "$DOCKER_IMAGE_NAME:latest" \
        --label "project=$PROJECT_NAME" \
        --label "environment=$ENVIRONMENT" \
        --label "build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --label "git-commit=$(git rev-parse HEAD 2>/dev/null || echo 'unknown')" \
        .
else
    docker build \
        --tag "$DOCKER_IMAGE_NAME:$DOCKER_TAG" \
        --label "project=$PROJECT_NAME" \
        --label "environment=$ENVIRONMENT" \
        .
fi

if [ $? -eq 0 ]; then
    success "Imagen construida exitosamente: $DOCKER_IMAGE_NAME:$DOCKER_TAG"
else
    error "Error construyendo la imagen"
fi

# Mostrar información de la imagen
log "Información de la imagen:"
docker images | grep "$DOCKER_IMAGE_NAME" | head -1

# Test básico de la imagen
log "Ejecutando test básico de la imagen..."
CONTAINER_ID=$(docker run -d -p 0:3000 "$DOCKER_IMAGE_NAME:$DOCKER_TAG")

sleep 10

# Health check
CONTAINER_PORT=$(docker port "$CONTAINER_ID" 3000/tcp | cut -d: -f2)
if command -v wget &> /dev/null; then
    if wget --spider --quiet "http://localhost:$CONTAINER_PORT/" 2>/dev/null; then
        success "Health check passed"
    else
        warning "Health check failed"
    fi
elif command -v curl &> /dev/null; then
    if curl -f "http://localhost:$CONTAINER_PORT/" > /dev/null 2>&1; then
        success "Health check passed"
    else
        warning "Health check failed"
    fi
else
    warning "No se pudo ejecutar health check (wget/curl no disponibles)"
fi

# Limpiar contenedor de test
docker stop "$CONTAINER_ID" > /dev/null
docker rm "$CONTAINER_ID" > /dev/null

# Opciones adicionales
echo ""
log "Comandos útiles:"
echo "  Ejecutar localmente:"
echo "    docker run -d -p 3000:3000 --name $PROJECT_NAME $DOCKER_IMAGE_NAME:$DOCKER_TAG"
echo ""
echo "  Ver logs:"
echo "    docker logs -f $PROJECT_NAME"
echo ""
echo "  Entrar al contenedor:"
echo "    docker exec -it $PROJECT_NAME sh"
echo ""
echo "  Parar y remover:"
echo "    docker stop $PROJECT_NAME && docker rm $PROJECT_NAME"

if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    log "Para deploy en producción:"
    echo "  docker-compose -f docker-compose.prod.yml up -d"
fi

success "Build completado exitosamente"