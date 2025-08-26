# 🔐 Health Checks y CORS Estricto - AquaLytics API

Guía completa de la implementación de endpoints de salud y configuración de seguridad CORS para el backend FastAPI.

## 🏥 Health Check Endpoints

### 1. `/health` - Basic Health Check
```http
GET /health
```

**Propósito**: Verificación rápida para monitoreo externo (Render, Fly.io, load balancers)

**Respuesta**:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2025-01-26T00:23:45.123Z"
}
```

**Características**:
- ⚡ **Respuesta rápida** (< 10ms)
- 🚫 **Sin verificaciones externas** (DB, APIs)
- 🤖 **Ideal para monitoring automático**

### 2. `/health/detailed` - Comprehensive Health Check
```http
GET /health/detailed
```

**Propósito**: Verificación completa con dependencias para debugging y monitoreo interno

**Respuesta Exitosa**:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production",
  "debug": false,
  "timestamp": "2025-01-26T00:23:45.123Z",
  "checks": {
    "api": {
      "status": "healthy",
      "response_time_ms": 0
    },
    "database": {
      "status": "healthy", 
      "response_time_ms": 45
    },
    "cors": {
      "status": "configured",
      "origins": 2
    }
  }
}
```

**Respuesta con Fallas**:
```json
{
  "status": "degraded",
  "version": "0.1.0",
  "environment": "production",
  "debug": false,
  "timestamp": "2025-01-26T00:23:45.123Z",
  "checks": {
    "api": {
      "status": "healthy",
      "response_time_ms": 0
    },
    "database": {
      "status": "unhealthy",
      "error": "connection timeout",
      "response_time_ms": null
    },
    "cors": {
      "status": "configured", 
      "origins": 2
    }
  }
}
```

**Características**:
- 🔍 **Verificación de base de datos** con timing
- ⏱️ **Métricas de performance** 
- 🐛 **Ideal para debugging**
- ⚠️ **Status degraded** si alguna dependencia falla

### 3. `/ready` - Readiness Check
```http
GET /ready
```

**Propósito**: Para Kubernetes/container orchestration - verifica si la app está lista para recibir tráfico

**Respuesta**:
```json
{
  "status": "ready",
  "timestamp": "2025-01-26T00:23:45.123Z",
  "version": "0.1.0"
}
```

**Características**:
- 🔧 **Verificación de configuración** esencial
- 🛣️ **Validación de rutas** críticas
- 🚀 **Ideal para deployment orchestration**

---

## 🛡️ Configuración CORS Estricta

### Headers CORS Configurados

```python
allow_origins = ["https://aqualytics-mvp.vercel.app", "https://localhost:3000"]
allow_credentials = True
allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
allow_headers = [
    "Accept",
    "Accept-Language", 
    "Content-Language",
    "Content-Type",
    "Authorization", 
    "X-Requested-With",
    "Cache-Control"
]
expose_headers = ["X-Total-Count", "X-Request-ID", "X-Response-Time-Ms"]
max_age = 600  # 10 minutos
```

### Middlewares de Seguridad Implementados

#### 1. Security Headers Middleware
Agrega headers de seguridad a todas las respuestas:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
X-API-Version: 0.1.0
X-Request-ID: req_1234567890
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**En producción con HTTPS**:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...
```

#### 2. CORS Preflight Middleware
Manejo granular de CORS preflight requests:

- ✅ **Validation estricta** de origins
- 🚫 **Bloqueo de origins no autorizados**
- 📝 **Logging de intentos de acceso**
- ⚡ **Respuestas optimizadas** para OPTIONS

#### 3. Request Logging Middleware
Logging de requests para monitoreo:

- 📊 **Métricas de response time**
- 🚨 **Alertas para requests lentos** (>1000ms)
- 🔍 **Logging de errores** con context
- 🛡️ **Sin información sensible**

---

## 🔧 Configuración en Producción

### Variables de Entorno CORS

```bash
# Desarrollo
AQUALYTICS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Producción
AQUALYTICS_ALLOWED_ORIGINS=https://aqualytics-mvp.vercel.app,https://your-domain.com
```

### Configuración en Render.com
```bash
AQUALYTICS_ALLOWED_ORIGINS=https://aqualytics-mvp.vercel.app
AQUALYTICS_ENVIRONMENT=production
AQUALYTICS_DEBUG=false
```

### Configuración en Fly.io
```bash
flyctl secrets set AQUALYTICS_ALLOWED_ORIGINS="https://aqualytics-mvp.vercel.app"
flyctl secrets set AQUALYTICS_ENVIRONMENT="production" 
flyctl secrets set AQUALYTICS_DEBUG="false"
```

---

## 🚀 Testing de Health Checks

### Local Development
```bash
# Basic health check
curl http://localhost:8000/health

# Detailed health check
curl http://localhost:8000/health/detailed

# Readiness check  
curl http://localhost:8000/ready
```

### Production Testing
```bash
# Basic health check
curl https://aqualytics-api.onrender.com/health

# Detailed health check  
curl https://aqualytics-api.onrender.com/health/detailed

# Readiness check
curl https://aqualytics-api.onrender.com/ready
```

### Expected Response Times
- `/health`: < 50ms
- `/health/detailed`: < 200ms (depende de DB)
- `/ready`: < 100ms

---

## 🧪 Testing CORS

### Preflight Request Test
```bash
curl -X OPTIONS \
  -H "Origin: https://aqualytics-mvp.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://aqualytics-api.onrender.com/api/v1/auth/login
```

**Expected Response Headers**:
```http
Access-Control-Allow-Origin: https://aqualytics-mvp.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, X-Requested-With, Cache-Control
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
```

### Blocked Origin Test
```bash
curl -X OPTIONS \
  -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  https://aqualytics-api.onrender.com/api/v1/auth/login
```

**Expected Response**: `403 Forbidden`
```json
{
  "error": "cors_forbidden",
  "message": "Origin not allowed",
  "detail": "Origin 'https://malicious-site.com' is not in the allowed origins list"
}
```

---

## 📊 Monitoreo y Alertas

### Health Check Monitoring
Configurar checks automáticos cada 30 segundos:

```yaml
# Para Render
healthcheck:
  path: /health
  initial_delay: 30s
  interval: 30s
  timeout: 10s
  
# Para Fly.io  
[[services.http_checks]]
  interval = "30s"
  timeout = "5s"
  path = "/health"
```

### Métricas Importantes
- **Response Time**: `/health` debe ser < 50ms
- **Database Latency**: En `/health/detailed` debe ser < 200ms
- **Error Rate**: < 1% de requests con status >= 400
- **CORS Blocks**: Monitorear origins bloqueados

### Logging y Alertas
Los middlewares automáticamente registran:
- 🐌 **Requests lentos**: > 1000ms
- ❌ **Errores**: Status >= 400
- 🚫 **CORS violations**: Origins bloqueados
- 🔍 **Request tracking**: Via X-Request-ID header

---

## 🛠️ Troubleshooting

### Health Check Issues

#### ❌ `/health` returns 500
**Causa**: Error en configuración básica
**Solución**: 
```bash
# Verificar configuración
curl https://your-api.com/ready

# Revisar logs de aplicación
```

#### ❌ `/health/detailed` shows "degraded"
**Causa**: Problema con base de datos
**Solución**:
```bash
# Verificar DATABASE_URL
echo $AQUALYTICS_DATABASE_URL

# Test de conectividad manual
psql $AQUALYTICS_DATABASE_URL -c "SELECT 1"
```

### CORS Issues

#### ❌ CORS Error en Frontend
**Síntomas**: `Access to fetch at 'API_URL' from origin 'FRONTEND_URL' has been blocked by CORS policy`

**Solución**:
1. Verificar `ALLOWED_ORIGINS`:
```bash
curl https://your-api.com/health/detailed | grep cors
```

2. Verificar formato correcto:
```bash
# ✅ Correcto
AQUALYTICS_ALLOWED_ORIGINS=https://domain1.com,https://domain2.com

# ❌ Incorrecto  
AQUALYTICS_ALLOWED_ORIGINS="https://domain1.com, https://domain2.com"  # Espacios extra
```

#### ❌ Preflight Fails
**Causa**: Headers o methods no permitidos
**Verificar**:
```bash
curl -I -X OPTIONS \
  -H "Origin: https://your-frontend.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization" \
  https://your-api.com/api/v1/endpoint
```

---

## 🎯 Best Practices Implementadas

✅ **Multiple Health Check Types**: Basic, detailed, readiness
✅ **Strict CORS Configuration**: Solo origins específicos  
✅ **Comprehensive Security Headers**: XSS, clickjacking, content-type protection
✅ **Request Tracking**: Unique request IDs para debugging
✅ **Performance Monitoring**: Response time tracking
✅ **Error Logging**: Comprehensive error tracking sin datos sensibles
✅ **Production Optimizations**: HSTS, CSP, permissions policy
✅ **Container Ready**: Readiness checks para orchestration

---

**🎉 Con esta implementación, el backend AquaLytics tiene un sistema robusto de health checks y seguridad CORS preparado para producción con monitoreo completo y debugging capabilities.**
