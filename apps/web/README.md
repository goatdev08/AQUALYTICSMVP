# 🏊 AquaLytics MVP - Frontend

Plataforma web moderna para análisis de rendimiento de equipos de natación.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **TypeScript**: Para tipado estático
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Autenticación**: Supabase Auth
- **Charts**: Chart.js + react-chartjs-2
- **Forms**: React Hook Form + Zod

## 🛠️ Desarrollo Local

### Prerrequisitos
```bash
node >= 20.x
pnpm >= 8.x
```

### Configuración Inicial

1. **Instalar dependencias** (desde la raíz del proyecto):
```bash
pnpm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env.local
# Editar .env.local con tus valores
```

3. **Iniciar servidor de desarrollo**:
```bash
# Desde la raíz del monorepo
pnpm dev

# O desde apps/web
cd apps/web && pnpm dev
```

4. **Abrir en el navegador**: [http://localhost:3000](http://localhost:3000)

### Variables de Entorno Requeridas

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Backend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional
NEXT_TELEMETRY_DISABLED=1
```

## 📁 Estructura del Proyecto

```
apps/web/src/
├── app/                 # App Router pages
│   ├── dashboard/       # Dashboard principal
│   ├── nadadores/       # Gestión de nadadores
│   ├── competencias/    # Gestión de competencias
│   ├── resultados/      # Registro y análisis
│   └── analitica/       # Analytics avanzados
├── components/          # Componentes reutilizables
│   ├── ui/             # shadcn/ui components
│   ├── auth/           # Componentes de autenticación
│   ├── layout/         # Layouts y navegación
│   └── [feature]/      # Componentes por feature
├── hooks/              # React hooks personalizados
├── stores/             # Zustand stores
├── lib/                # Utilidades y configuración
└── types/              # Definiciones TypeScript
```

## 🎨 Sistema de Diseño

### Tema Principal
- **Color primario**: Verde (`hsl(142, 76%, 36%)`)
- **Font**: Inter (sistema)
- **Components**: shadcn/ui con personalizaciones
- **Icons**: Lucide React

### Componentes Principales
- **AppLayout**: Layout principal con sidebar
- **SimpleLayout**: Layout simple para auth pages
- **Cards**: Contenedores con gradients y shadows
- **Forms**: React Hook Form + validación Zod
- **Tables**: Componentes de tabla optimizados

## 📊 Gestión de Estado

### Zustand Stores
- **dashboard-store**: Filtros y configuración del dashboard
- **resultados-store**: Estado persistente de la tabla de resultados
- **ui-store**: Estados globales de UI

### TanStack Query
- **Caching** inteligente de datos de API
- **Background updates** automáticos
- **Optimistic updates** para mejor UX

## 🔐 Autenticación

### Supabase Auth
- **Login/Register**: Formularios con validación
- **Protected Routes**: HOC para rutas protegidas
- **Role-based access**: Control por roles (entrenador/atleta)
- **Middleware**: Validación de sesión automática

## 📱 Features Principales

### 📈 Dashboard
- KPIs en tiempo real
- Gráficos interactivos (Chart.js)
- Listas de próximas competencias
- Actividad reciente

### 🏊‍♀️ Gestión de Nadadores
- CRUD completo
- Analytics individuales
- Categorización automática
- Históricos de rendimiento

### 🏆 Competencias
- Programación de eventos
- Gestión de pruebas
- Estados de competencia
- Registro de resultados

### 📊 Resultados y Analytics
- Registro paso a paso (stepper)
- Tabla con filtros avanzados persistentes
- Modal de detalles con segmentos
- Análisis comparativo y pacing

## 🚀 Deployment

### Producción (Vercel)

Ver documentación detallada en [VERCEL_SETUP.md](../../VERCEL_SETUP.md)

**Build Command**: `cd apps/web && pnpm build`
**Output Directory**: `apps/web/.next`

### Variables de Entorno en Vercel
Todas las variables `NEXT_PUBLIC_*` deben configurarse en Vercel Dashboard.

## 🧪 Testing & Quality

### Scripts Disponibles
```bash
pnpm dev      # Desarrollo
pnpm build    # Build de producción
pnpm start    # Servidor de producción
pnpm lint     # ESLint
```

### Code Quality
- **ESLint**: Configuración Next.js + TypeScript
- **TypeScript**: Strict mode habilitado
- **Prettier**: Formateo automático (recomendado)

## 📚 Recursos y Documentación

### Documentación Técnica
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)

### Arquitectura del Proyecto
- **Monorepo**: pnpm workspaces
- **Component-driven**: Desarrollo por componentes
- **Type-safe**: TypeScript en todo el stack
- **Modern React**: Hooks, Server Components, Suspense

## 🔧 Troubleshooting

### Problemas Comunes

#### Build Errors
```bash
# Limpiar caché
rm -rf .next
pnpm build
```

#### Problemas de API
- Verificar `NEXT_PUBLIC_API_BASE_URL`
- Comprobar que el backend esté corriendo
- Revisar CORS configuration

#### Problemas de Supabase
- Verificar variables de entorno Supabase
- Comprobar configuración RLS
- Revisar políticas de acceso

---

**🎯 Esta aplicación está optimizada para equipos de natación que buscan análisis de rendimiento basado en datos.**
