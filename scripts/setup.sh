#!/bin/bash
# Script de configuración inicial para AquaLytics MVP

set -e

echo "🚀 Configurando AquaLytics MVP..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado. Instala Node.js 20+ primero."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js versión 20+ requerida. Versión actual: $(node --version)"
    exit 1
fi
success "Node.js $(node --version) ✓"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    error "Python 3 no está instalado. Instala Python 3.11+ primero."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
success "Python $(python3 --version) ✓"

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    info "Instalando pnpm..."
    npm install -g pnpm
fi
success "pnpm $(pnpm --version) ✓"

# Instalar dependencias del frontend
info "Instalando dependencias del frontend..."
pnpm install
success "Frontend configurado ✓"

# Configurar backend
info "Configurando backend..."
cd services/api

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    info "Creando entorno virtual de Python..."
    python3 -m venv venv
fi

# Activar entorno virtual e instalar dependencias
info "Instalando dependencias del backend..."
source venv/bin/activate
pip install --upgrade pip
pip install -e .
success "Backend configurado ✓"

cd ../..

# Verificar archivos de configuración
info "Verificando configuración..."

if [ ! -f "services/api/.env" ]; then
    warning "Archivo services/api/.env no encontrado"
    info "Copia services/api/env.example como services/api/.env y configura las variables"
fi

if [ ! -f "apps/web/.env.local" ]; then
    warning "Archivo apps/web/.env.local no encontrado"
    info "Copia apps/web/env.local.example como apps/web/.env.local y configura las variables"
fi

echo ""
success "🎉 ¡Configuración completada!"
echo ""
info "Próximos pasos:"
echo "1. Configurar variables de entorno (.env files)"
echo "2. Ejecutar: pnpm dev"
echo "3. Abrir: http://localhost:3000 (frontend) y http://localhost:8000 (API)"
echo ""
