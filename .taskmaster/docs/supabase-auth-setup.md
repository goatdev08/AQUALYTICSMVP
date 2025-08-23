# Configuración de Supabase Auth - Guía Paso a Paso

## 📝 Configuración Manual Requerida

### 1. Habilitar Email Provider

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/chdkehrtzkurqlufkhks)
2. Navegar a: **Authentication** → **Providers**
3. Buscar **Email** en la lista de providers
4. Hacer clic en **Email** para configurar
5. **Habilitar** el provider de Email
6. Configuraciones recomendadas para MVP:
   - ✅ **Enable email provider**
   - ✅ **Enable email confirmations** (opcional - puedes deshabilitarlo para desarrollo)
   - ✅ **Enable email change confirmations**
   - ⚠️ **SMTP Settings**: Usar el servidor de Supabase por defecto (ya configurado)

### 2. Configurar URL de redirección

En la misma sección de Authentication:

1. Ir a **Authentication** → **URL Configuration**
2. En **Site URL** agregar: `http://localhost:3000`
3. En **Redirect URLs** agregar:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

### 3. Configurar RLS (Row Level Security) - Opcional para MVP

Por ahora dejamos RLS deshabilitado en la tabla `usuario` para simplificar el MVP.
El backend se encargará de validar permisos por rol.

### 4. Variables de entorno confirmadas

Verificar que tienes estas variables en tus archivos .env:

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://chdkehrtzkurqlufkhks.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZGtlaHJ0emt1cnFsdWZraGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTQ1MzgsImV4cCI6MjA3MTEzMDUzOH0.Im7qaR8xOZhPL84TlgOahnbcHURiPm1kBZfj3skPWjg
```

#### Backend (.env)

```bash
AQUALYTICS_SUPABASE_URL=https://chdkehrtzkurqlufkhks.supabase.co
AQUALYTICS_SUPABASE_JWT_SECRET=[El JWT Secret de tu proyecto - buscar en Project Settings → API]
```

## ✅ Verificación Post-Configuración

Una vez completada la configuración, podrás:

1. Registrar usuarios con email/password
2. Hacer login con credenciales
3. El frontend recibirá tokens JWT válidos
4. El backend podrá validar estos tokens

## 🚨 Importante para el MVP

- Mantener RLS deshabilitado por simplicidad
- El backend manejará todos los permisos por rol
- Configuración mínima para comenzar desarrollo rápido

## ⚠️ Rate Limits de Email (Conocido)

- **Límite actual**: 2 emails por hora con servicio integrado
- **Impacto**: Solo afecta registro/recuperación de contraseña
- **Para MVP**: Suficiente para desarrollo y testing inicial
- **Solución futura**: Configurar SMTP personalizado (SendGrid, AWS SES)
- **Documentación**: <https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits>

## 🔧 Archivos de Testing

- `test-supabase.ts`: Solo para verificación de configuración
- Los valores "no usados" son intencionales (solo verificamos errores, no datos)
- No se incluye en build de producción
