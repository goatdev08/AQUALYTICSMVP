# 🚀 Configuración de GitHub Actions para AquaLytics

Guía completa para configurar CI/CD con GitHub Actions, incluyendo todos los secrets y configuraciones necesarias.

## 📋 Workflows Incluidos

### 🔄 CI/CD Principal (`ci-cd.yml`)
- **Trigger**: Push a `main`/`develop`, manual
- **Funciones**: Lint, build, test, deploy automático
- **Deploy**: Vercel (frontend) + Render (backend)

### 🔍 PR Checks (`pr-check.yml`) 
- **Trigger**: Pull requests
- **Funciones**: CI ligero y rápido para PRs
- **Sin deploy**: Solo verificación de código

### 📦 Releases (`release.yml`)
- **Trigger**: Tags de versión (`v*.*.*`)
- **Funciones**: Build artifacts, crear GitHub releases
- **Assets**: Builds, configuraciones, changelog

### 🔐 Security (`security-scan.yml`)
- **Trigger**: Push, PRs, schedule semanal, manual
- **Funciones**: CodeQL, dependency scan, SAST, secret detection

### 🧹 Cleanup (`cleanup.yml`)
- **Trigger**: Schedule semanal
- **Funciones**: Limpiar artifacts y workflow runs antiguos

---

## 🔑 Secrets Requeridos

### Para configurar en GitHub: Settings > Secrets and variables > Actions

#### 🌐 Vercel Deployment
| Secret Name | Descripción | Cómo Obtener |
|-------------|-------------|--------------|
| `VERCEL_TOKEN` | Token de acceso personal | [Vercel Settings > Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID de la organización | `vercel link` o Vercel Dashboard |
| `VERCEL_PROJECT_ID` | ID del proyecto | `vercel link` o Vercel Dashboard |

**Pasos para obtener IDs de Vercel:**
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link proyecto (ejecutar en raíz del repo)
vercel link

# 4. Los IDs aparecerán en el archivo .vercel/project.json
cat .vercel/project.json
```

#### 🔧 Render Deployment  
| Secret Name | Descripción | Cómo Obtener |
|-------------|-------------|--------------|
| `RENDER_API_KEY` | API Key de Render | [Render Account Settings > API Keys](https://dashboard.render.com/account) |
| `RENDER_SERVICE_ID` | ID del servicio backend | Dashboard de Render > Tu servicio > Settings |

**Pasos para obtener Service ID:**
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio de AquaLytics API
3. En la URL verás algo como: `https://dashboard.render.com/web/srv-XXXXXXXXX`
4. El Service ID es la parte `srv-XXXXXXXXX`

---

## ⚙️ Configuración Paso a Paso

### 1. Crear Repositorio en GitHub
```bash
# Si aún no tienes el repo en GitHub
git remote add origin https://github.com/tu-usuario/aqualytics-mvp.git
git branch -M main
git push -u origin main
```

### 2. Configurar Secrets
Ve a tu repositorio en GitHub:
1. **Settings** > **Secrets and variables** > **Actions**
2. Click **"New repository secret"**
3. Agrega cada secret de la tabla anterior

### 3. Configurar Vercel
```bash
# En tu proyecto local
vercel link

# Configurar proyecto para deployment
vercel --prod
```

### 4. Configurar Render
1. Crea tu servicio web en Render
2. Conecta tu repositorio GitHub
3. Configura:
   - **Build Command**: `pip install --upgrade pip && pip install -e .`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `services/api`

### 5. Verificar Configuración
Crea un commit y push para probar:
```bash
git add .
git commit -m "feat: setup github actions ci/cd"
git push origin main
```

---

## 🔧 Variables de Entorno por Plataforma

### Vercel Environment Variables
Configurar en Vercel Dashboard > Project > Settings > Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=https://aqualytics-api.onrender.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Render Environment Variables
Configurar en Render Dashboard > Service > Environment:

```bash
AQUALYTICS_DATABASE_URL=postgresql://username:password@host:port/db
AQUALYTICS_ALLOWED_ORIGINS=https://aqualytics-mvp.vercel.app,https://localhost:3000
AQUALYTICS_SECRET_KEY=your-super-secret-32-character-key
AQUALYTICS_SUPABASE_URL=https://your-project.supabase.co
AQUALYTICS_SUPABASE_JWT_SECRET=your-jwt-secret
AQUALYTICS_ENVIRONMENT=production
AQUALYTICS_DEBUG=false
AQUALYTICS_LOG_LEVEL=INFO
```

---

## 📊 Workflows Explicados

### 🔄 CI/CD Workflow
```yaml
# Detección inteligente de cambios
detect-changes:
  - Solo ejecuta CI/build si hay cambios relevantes
  - Frontend: apps/web/**, package.json
  - Backend: services/api/**, database/**

# CI paralelo por componente
ci-frontend: lint + build
ci-backend: lint + test + security

# Deploy automático (solo en main)
deploy-frontend: Vercel
deploy-backend: Render
```

### 🔍 PR Check Workflow
- **Rápido**: Solo linting y build verification
- **Sin deploy**: Para feedback rápido en PRs
- **Smart**: Solo ejecuta checks en archivos modificados

### 📦 Release Workflow
- **Trigger**: `git tag v1.0.0 && git push origin v1.0.0`
- **Genera**: Artifacts de build, changelog, GitHub release
- **Assets**: Frontend build, backend source, deployment configs

### 🔐 Security Workflow
- **CodeQL**: Análisis estático de seguridad
- **Dependency scanning**: Vulnerabilidades en dependencias
- **Secret detection**: Búsqueda de secrets hardcodeados
- **SAST**: Static Application Security Testing

---

## 🚀 Uso de los Workflows

### Deploy a Producción
```bash
# Opción 1: Push a main (automático)
git checkout main
git merge develop
git push origin main

# Opción 2: Manual trigger
# GitHub > Actions > CI/CD > Run workflow > Deploy: true
```

### Crear Release
```bash
# Crear y push tag
git tag v1.0.0
git push origin v1.0.0

# Automáticamente se crea GitHub Release con artifacts
```

### Verificar PR
```bash
# Crear PR - automáticamente ejecuta PR checks
gh pr create --title "Feature: nueva funcionalidad"

# Los checks aparecen en la PR con resultados
```

---

## 🛠️ Troubleshooting

### ❌ Errores Comunes

#### Vercel Deploy Falla
```bash
# Verificar secrets
VERCEL_TOKEN ✓
VERCEL_ORG_ID ✓  
VERCEL_PROJECT_ID ✓

# Verificar comando build
cd apps/web && pnpm build  # Debe funcionar localmente
```

#### Render Deploy Falla
```bash
# Verificar secrets
RENDER_API_KEY ✓
RENDER_SERVICE_ID ✓

# Verificar que el servicio existe y está conectado al repo
```

#### Build Frontend Falla
- Verificar que `pnpm build` funciona localmente
- Revisar variables de entorno en Vercel
- Verificar versión de Node.js (debe ser 20.x)

#### Build Backend Falla
- Verificar que `pip install -e .` funciona localmente
- Revisar dependencias en `pyproject.toml`
- Verificar versión de Python (debe ser 3.11)

### 📋 Checklist de Verificación

- [ ] Todos los secrets configurados
- [ ] Variables de entorno en Vercel
- [ ] Variables de entorno en Render
- [ ] Build local funciona (frontend y backend)
- [ ] Tests pasan localmente
- [ ] Commit y push a main triggers CI/CD

---

## 📈 Monitoring y Maintenance

### Revisar Regularmente:
- **GitHub Actions usage**: Settings > Billing > Actions
- **Security alerts**: Security > Dependabot alerts
- **Workflow success rate**: Actions tab
- **Artifact storage**: Actions > Artifacts

### Optimizaciones:
- **Cache dependencies**: Ya implementado en workflows
- **Parallel jobs**: Ya optimizado por componente
- **Skip unnecessary runs**: Detección de cambios implementada
- **Cleanup old artifacts**: Workflow automático semanal

---

## 🎯 Best Practices Implementadas

✅ **Smart Change Detection**: Solo ejecuta lo necesario
✅ **Parallel Execution**: CI frontend/backend en paralelo  
✅ **Security Scanning**: Múltiples herramientas de seguridad
✅ **Automatic Cleanup**: Limpieza automática de storage
✅ **Comprehensive Testing**: Lint, build, test, security
✅ **Zero-downtime Deploy**: Deploy automático con verificación
✅ **Rollback Ready**: Tags y releases para rollback fácil

---

**🎉 Una vez configurado correctamente, tendrás un pipeline CI/CD completamente automatizado que maneja testing, security, deployment y maintenance de tu aplicación AquaLytics.**
