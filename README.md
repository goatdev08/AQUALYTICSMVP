# AquaLytics MVP

Plataforma para registrar, analizar y comparar resultados de natación.

## Stack Tecnológico

- **Frontend**: Next.js 15 + TypeScript + Tailwind + shadcn/ui
- **Backend**: FastAPI + Pydantic v2 + SQLModel
- **Base de datos**: Supabase (Postgres)
- **Despliegue**: Vercel (web) + Render (API)

## Estructura del Proyecto

```
├── apps/
│   └── web/           # Next.js 15 frontend
├── services/
│   └── api/           # FastAPI backend
├── database/
│   └── ddl/           # Scripts SQL (tablas, índices, vistas)
├── scripts/           # Scripts de automatización
├── docs/              # Documentación adicional
└── .taskmaster/       # PRD y tareas del proyecto
```

## Configuración de Desarrollo

### Prerrequisitos

- Node.js 20 LTS
- Python 3.11+
- PNPM 8+
- Cuenta de Supabase

### Instalación

1. **Clonar el repositorio:**

```bash
git clone https://github.com/goatdev08/AQUALYTICSMVP.git
cd Aqualytics_mvp
```

2. **Usar la versión correcta de Node:**

```bash
nvm use  # o instalar Node.js 20+
```

3. **Configuración automática (recomendado):**

```bash
./scripts/setup.sh
```

**O instalación manual:**

```bash
pnpm setup:full
```

4. **Configurar variables de entorno:**

```bash
# Backend
cp services/api/env.example services/api/.env
# Editar services/api/.env con valores reales

# Frontend  
cp apps/web/env.local.example apps/web/.env.local
# Editar apps/web/.env.local con valores reales
```

5. **Ejecutar en desarrollo:**

```bash
pnpm dev
```

6. **Acceder a las aplicaciones:**

- 🌐 **Frontend**: <http://localhost:3000>
- 🔌 **API**: <http://localhost:8000>
- 📖 **Docs API**: <http://localhost:8000/docs>

## Scripts Disponibles

### Scripts principales

- `pnpm dev` - 🚀 **Ejecutar web y API en paralelo** (recomendado)
- `pnpm build` - 📦 Build de producción (solo frontend)
- `pnpm lint` - 🔍 Linter para ambas apps (ESLint + Ruff)
- `pnpm test` - 🧪 Tests para ambas apps
- `pnpm setup` - ⚙️ Instalación básica de dependencias
- `pnpm setup:full` - 🚀 Instalación completa con feedback
- `pnpm clean` - 🧹 Limpiar archivos temporales

### Scripts específicos por aplicación

- `pnpm dev:web` - Solo frontend (puerto 3000)
- `pnpm dev:api` - Solo backend (puerto 8000)
- `pnpm build:web` - Build solo del frontend
- `pnpm lint:web` - Linter solo del frontend
- `pnpm lint:api` - Linter solo del backend
- `pnpm test:web` - Tests solo del frontend
- `pnpm test:api` - Tests solo del backend

### Script de configuración avanzada

```bash
# Configuración interactiva completa
./scripts/setup.sh
```

## Variables de Entorno

### Backend (services/api/.env)

```bash
# Copiar desde services/api/env.example
cp services/api/env.example services/api/.env
```

**Variables requeridas:**

```bash
# Base de datos PostgreSQL/Supabase
AQUALYTICS_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Configuración de entorno
AQUALYTICS_ENVIRONMENT=development  # development, testing, staging, production
AQUALYTICS_DEBUG=true              # Solo en desarrollo

# CORS - Orígenes permitidos (separados por comas)
AQUALYTICS_ALLOWED_ORIGINS=http://localhost:3000

# Supabase (opcional para validar JWT)
AQUALYTICS_SUPABASE_URL=https://[PROJECT].supabase.co
AQUALYTICS_SUPABASE_JWT_SECRET=[JWT_SECRET]

# Seguridad JWT
AQUALYTICS_SECRET_KEY=dev-secret-key-change-in-production
AQUALYTICS_ALGORITHM=HS256
AQUALYTICS_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración de aplicación
AQUALYTICS_LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR, CRITICAL
AQUALYTICS_DEFAULT_PAGE_SIZE=20    # Resultados por página
AQUALYTICS_MAX_PAGE_SIZE=100       # Máximo resultados por página
```

### Frontend (apps/web/.env.local)

```bash
# Copiar desde apps/web/env.local.example
cp apps/web/env.local.example apps/web/.env.local
```

**Variables requeridas:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]

# API Backend URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # Desarrollo
# NEXT_PUBLIC_API_BASE_URL=https://your-api.render.com  # Producción

# Next.js Configuration
NODE_ENV=development  # development, production
```

### Configuración de Producción

Para despliegue en producción, actualizar:

- **Backend**: `AQUALYTICS_ENVIRONMENT=production`, `AQUALYTICS_DEBUG=false`
- **Frontend**: `NODE_ENV=production`, URL del backend desplegado
- **CORS**: Agregar dominio de Vercel a `AQUALYTICS_ALLOWED_ORIGINS`

**Nota**: El archivo `.env` en la raíz es para Taskmaster AI (no modificar).

## Desarrollo

El proyecto usa un monorepo con PNPM workspaces. Cada aplicación tiene sus propias dependencias y configuraciones.

Ver [reglas del proyecto](.cursor/rules/aqualytics_project_rules.mdc) para pautas de desarrollo.

## Contribuir

1. Crear rama: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios y commits
3. Abrir Pull Request a `develop`

## Licencia

MIT
