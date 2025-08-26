# 🚀 Deployment del Backend AquaLytics FastAPI

Guía completa para deployar el backend de AquaLytics en diferentes plataformas de cloud.

## 📋 Requisitos Previos

### Variables de Entorno Críticas

Estas variables son **OBLIGATORIAS** para el funcionamiento en producción:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `AQUALYTICS_DATABASE_URL` | URL de PostgreSQL/Supabase | `postgresql://user:pass@host:5432/db` |
| `AQUALYTICS_ALLOWED_ORIGINS` | Dominios frontend (separados por comas) | `https://aqualytics-mvp.vercel.app,https://localhost:3000` |
| `AQUALYTICS_SECRET_KEY` | Clave JWT (32+ caracteres) | `super-secret-key-change-in-production-32chars` |
| `AQUALYTICS_SUPABASE_URL` | URL del proyecto Supabase | `https://your-project.supabase.co` |
| `AQUALYTICS_SUPABASE_JWT_SECRET` | JWT Secret de Supabase | `your-jwt-secret-from-supabase` |

### Variables Opcionales (con defaults)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `AQUALYTICS_ENVIRONMENT` | `production` | Entorno de ejecución |
| `AQUALYTICS_DEBUG` | `false` | Modo debug |
| `AQUALYTICS_LOG_LEVEL` | `INFO` | Nivel de logging |
| `AQUALYTICS_API_V1_STR` | `/api/v1` | Prefijo de API |

---

## 🟢 Opción 1: Render.com (RECOMENDADO - Gratis)

### Por qué Render

- ✅ **Tier gratuito** generoso (750 horas/mes)
- ✅ **Auto-deploy** desde GitHub
- ✅ **SSL automático** y dominio personalizado
- ✅ **PostgreSQL gratis** (opcional, usamos Supabase)
- ✅ **Health checks** automáticos
- ✅ **Fácil configuración** de variables de entorno

### Pasos de Deployment

#### 1. Preparar el Repositorio

```bash
# Asegurar que render.yaml está en services/api/
cd services/api
ls render.yaml  # Debe existir
```

#### 2. Crear Servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click **"New" > "Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `aqualytics-api`
   - **Region**: Oregon (us-west)
   - **Branch**: `main`
   - **Root Directory**: `services/api`
   - **Runtime**: Python 3
   - **Build Command**: `pip install --upgrade pip && pip install -e .`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 3. Configurar Variables de Entorno

En Render Dashboard > Tu Servicio > Environment:

```bash
AQUALYTICS_DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
AQUALYTICS_ALLOWED_ORIGINS=https://aqualytics-mvp.vercel.app,https://localhost:3000
AQUALYTICS_SECRET_KEY=your-super-secret-32-character-key-here
AQUALYTICS_SUPABASE_URL=https://your-project.supabase.co
AQUALYTICS_SUPABASE_JWT_SECRET=your-jwt-secret
AQUALYTICS_ENVIRONMENT=production
AQUALYTICS_DEBUG=false
AQUALYTICS_LOG_LEVEL=INFO
```

#### 4. Obtener Variables de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. **Database URL**: Settings > Database > Connection string (URI)
4. **JWT Secret**: Settings > API > JWT Secret
5. **Project URL**: Settings > API > Project URL

#### 5. Deploy

- Render detectará automáticamente el `render.yaml`
- El deploy se iniciará automáticamente
- Monitorea los logs en el dashboard

#### 6. Verificar Deployment

```bash
# Test health endpoint
curl https://aqualytics-api.onrender.com/health

# Test API
curl https://aqualytics-api.onrender.com/api/v1/docs
```

---

## 🟦 Opción 2: Fly.io (Alternativa Premium)

### Por qué Fly.io

- ✅ **Performance superior** con edge locations
- ✅ **Escalado automático**
- ✅ **Soporte completo de Docker**
- ✅ **PostgreSQL incluido**
- 💰 **Pago por uso** (no tier gratuito extenso)

### Pasos de Deployment

#### 1. Instalar Fly CLI

```bash
# macOS
curl -L https://fly.io/install.sh | sh

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### 2. Login y Crear App

```bash
# Login
flyctl auth login

# Crear app (desde services/api)
cd services/api
flyctl apps create aqualytics-api --org personal
```

#### 3. Configurar Variables de Entorno

```bash
flyctl secrets set AQUALYTICS_DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
flyctl secrets set AQUALYTICS_ALLOWED_ORIGINS="https://aqualytics-mvp.vercel.app,https://localhost:3000"
flyctl secrets set AQUALYTICS_SECRET_KEY="your-super-secret-32-character-key-here"
flyctl secrets set AQUALYTICS_SUPABASE_URL="https://your-project.supabase.co"
flyctl secrets set AQUALYTICS_SUPABASE_JWT_SECRET="your-jwt-secret"
```

#### 4. Deploy

```bash
flyctl deploy
```

#### 5. Abrir App

```bash
flyctl open
```

---

## 🐳 Opción 3: Docker (Para cualquier plataforma)

### Plataformas Compatibles

- **Railway**: Deployment directo desde Dockerfile
- **DigitalOcean App Platform**: Docker + auto-scaling
- **AWS Fargate**: Serverless containers
- **Google Cloud Run**: Pay-per-request
- **Azure Container Instances**: Simple containers

### Build y Deploy

#### 1. Build Local

```bash
cd services/api

# Build imagen
docker build -t aqualytics-api .

# Test local
docker run -p 8000:8000 \
  -e AQUALYTICS_DATABASE_URL="postgresql://..." \
  -e AQUALYTICS_ALLOWED_ORIGINS="https://aqualytics-mvp.vercel.app" \
  -e AQUALYTICS_SECRET_KEY="your-secret-key" \
  aqualytics-api
```

#### 2. Build Multi-platform (para deploy)

```bash
# Para deployment en cloud
docker buildx build --platform linux/amd64,linux/arm64 \
  -t your-registry/aqualytics-api:latest .
```

#### 3. Push a Registry

```bash
# Docker Hub
docker tag aqualytics-api your-username/aqualytics-api:latest
docker push your-username/aqualytics-api:latest

# GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker tag aqualytics-api ghcr.io/your-username/aqualytics-api:latest
docker push ghcr.io/your-username/aqualytics-api:latest
```

---

## 🔧 Configuración Post-Deployment

### 1. Verificar Health Check

```bash
curl https://your-api-domain.com/health
```

**Respuesta esperada:**

```json
{
  "status": "healthy",
  "environment": "production",
  "debug": false,
  "version": "0.1.0"
}
```

### 2. Probar API Endpoints

```bash
# Docs interactivas
https://your-api-domain.com/api/v1/docs

# OpenAPI schema
https://your-api-domain.com/api/v1/openapi.json
```

### 3. Actualizar Frontend

En Vercel, actualizar `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "https://your-api-domain.com/api/v1/$1"
    }
  ]
}
```

### 4. Configurar CORS en Frontend

Actualizar variable de entorno del backend:

```bash
AQUALYTICS_ALLOWED_ORIGINS=https://aqualytics-mvp.vercel.app,https://your-custom-domain.com
```

---

## 🐛 Troubleshooting

### Problemas Comunes

#### ❌ Error 500 - Internal Server Error

```bash
# Revisar logs
# Render: Dashboard > Logs
# Fly.io: flyctl logs
# Docker: docker logs container-id

# Verificar variables de entorno
curl https://your-api.com/health
```

#### ❌ CORS Errors

```bash
# Verificar ALLOWED_ORIGINS incluye tu dominio frontend
# Ejemplo correcto:
AQUALYTICS_ALLOWED_ORIGINS=https://aqualytics-mvp.vercel.app,https://localhost:3000
```

#### ❌ Database Connection Error

```bash
# Verificar DATABASE_URL format:
postgresql://username:password@hostname:port/database

# Ejemplo Supabase:
postgresql://postgres:password@db.abc123.supabase.co:5432/postgres
```

#### ❌ JWT Token Issues

```bash
# Verificar que SUPABASE_JWT_SECRET coincida con:
# Supabase Dashboard > Settings > API > JWT Secret
```

### Logs Útiles

```bash
# Ver logs en vivo (Render)
render logs --tail aqualytics-api

# Ver logs (Fly.io)  
flyctl logs --app aqualytics-api

# Ver logs (Docker)
docker logs -f container-name
```

---

## 📈 Monitoreo y Mantenimiento

### Health Checks Automáticos

Todas las plataformas están configuradas para verificar `/health` cada 30 segundos.

### Actualizaciones

```bash
# Auto-deploy está habilitado para push a main branch
git push origin main

# Deploy manual (Fly.io)
flyctl deploy

# Build nueva imagen (Docker)
docker build -t aqualytics-api:v1.1.0 .
```

### Escalado

- **Render Free**: 1 instancia máximo
- **Fly.io**: Auto-scaling basado en demanda
- **Docker**: Configurar según plataforma

---

## 🎯 Recomendación Final

**Para MVP/desarrollo**: Usa **Render.com** (gratis, simple, confiable)
**Para producción**: Considera **Fly.io** (mejor performance) o **Google Cloud Run** (pay-per-use)

La configuración está optimizada para cualquiera de estas opciones con minimal config changes.
