# 🚀 Configuración de Deployment en Vercel

Este documento describe cómo configurar el deployment de AquaLytics MVP en Vercel con todas las variables de entorno y configuraciones necesarias.

## 📋 Variables de Entorno Requeridas

### 🔐 Supabase Configuration
Configurar en Vercel > Project Settings > Environment Variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Clave anónima pública de Supabase |

**📍 Cómo encontrar estos valores:**
1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a Settings > API
4. Copia la "Project URL" y la "anon public key"

### 🔗 API Backend Configuration

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://aqualytics-api.onrender.com` | URL de tu backend FastAPI |
| `NEXT_PUBLIC_SITE_URL` | `https://aqualytics-mvp.vercel.app` | URL de tu frontend (para CORS) |

### ⚙️ Next.js Configuration

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `NEXT_TELEMETRY_DISABLED` | `1` | Deshabilita telemetría |

---

## 🏗️ Configuración de Build

### Build Commands
```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": "apps/web/.next"
}
```

### Framework Detection
- **Framework**: Next.js
- **Node Version**: 20.x (recomendado)
- **Package Manager**: pnpm

---

## 🔄 Configuración de Proxy (Rewrites)

El archivo `vercel.json` incluye rewrites para proxy al backend:

```json
{
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "https://aqualytics-api.onrender.com/api/v1/$1"
    }
  ]
}
```

---

## 🔒 Configuración de Seguridad

### Headers de Seguridad
- ✅ **CORS** configurado para dominio específico
- ✅ **X-Frame-Options**: DENY (previene clickjacking)
- ✅ **X-Content-Type-Options**: nosniff
- ✅ **Referrer-Policy**: strict-origin-when-cross-origin
- ✅ **Permissions-Policy**: Restringe acceso a cámara/micrófono/ubicación

### CORS Policy
```json
{
  "Access-Control-Allow-Origin": "https://aqualytics-mvp.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true"
}
```

---

## 📦 Pasos de Deployment

### 1. Preparar el Repositorio
```bash
# Asegurar que el proyecto está listo
git add .
git commit -m "feat: configure vercel deployment"
git push origin main
```

### 2. Conectar con Vercel
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Importa tu repositorio de GitHub
4. Configura:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (monorepo)
   - **Build Command**: `cd apps/web && pnpm build`
   - **Output Directory**: `apps/web/.next`

### 3. Configurar Variables de Entorno
1. Ve a Project Settings > Environment Variables
2. Agrega todas las variables listadas arriba
3. Configura para **Production**, **Preview**, y **Development**

### 4. Configurar Dominio (Opcional)
1. Ve a Project Settings > Domains
2. Agrega tu dominio personalizado
3. Actualiza `NEXT_PUBLIC_SITE_URL` si usas dominio custom

---

## 🔄 Auto-Deploy Configuration

### GitHub Integration
- ✅ **Auto-deploy** habilitado para branch `main`
- ✅ **Preview deployments** para pull requests
- ✅ **Build optimizations** habilitadas

### Build Optimization
```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./",
  "github": {
    "autoAlias": false
  }
}
```

---

## 🧪 Testing del Deployment

### Pre-Deploy Checklist
- [ ] Variables de entorno configuradas
- [ ] Backend API deployado y funcionando
- [ ] Supabase configurado con datos de prueba
- [ ] Build local exitoso (`cd apps/web && pnpm build`)

### Post-Deploy Testing
```bash
# Test URLs
curl https://aqualytics-mvp.vercel.app/api/health
curl https://aqualytics-mvp.vercel.app/login
curl https://aqualytics-mvp.vercel.app/
```

### Troubleshooting Common Issues

#### ❌ Build Failures
- Verificar que todas las dependencias están en `package.json`
- Revisar errores de TypeScript
- Verificar rutas de imports

#### ❌ API Connection Issues
- Verificar `NEXT_PUBLIC_API_BASE_URL`
- Verificar CORS en el backend
- Verificar que el backend está online

#### ❌ Supabase Connection Issues
- Verificar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verificar configuración de RLS en Supabase
- Verificar tablas y datos de prueba

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Configurar Vercel Analytics para métricas de performance
- Monitorear Core Web Vitals
- Revisar logs de errores regularmente

### Performance Optimization
- ✅ **Standalone output** configurado
- ✅ **Package imports** optimizados
- ✅ **Regions** configuradas (iad1, fra1)
- ✅ **Function timeout** establecido (30s)

---

## 🔧 Maintenance

### Regular Updates
- Mantener dependencias actualizadas
- Revisar y rotar API keys regularmente
- Monitorear uso de recursos en Vercel

### Security Reviews
- Auditar headers de seguridad
- Revisar configuración CORS
- Validar variables de entorno periódicamente

---

**✨ Una vez completada esta configuración, tu aplicación estará lista para producción con todas las mejores prácticas de seguridad y performance aplicadas.**
