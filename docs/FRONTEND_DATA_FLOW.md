# 🔄 Frontend Data Flow Documentation

## Resumen General

Este documento describe el flujo completo de datos desde la API hasta la interfaz de usuario en AquaLytics, enfocándose en los componentes de analytics y perfil de nadador.

## 🏗️ Arquitectura General

```
API Backend → Custom Hooks → UI Components → User Interface
     ↓              ↓              ↓              ↓
  FastAPI      React Query    Lazy Loading    Responsive UI
  Pydantic     TanStack       Suspense        shadcn/ui
  SQLAlchemy   Auth Context   Error States    Lucide Icons
```

## 📊 Analytics Data Flow

### 1. Hook Principal: `useNadadorAnalytics`

**Ubicación:** `apps/web/src/hooks/useNadadorAnalytics.ts`

**Propósito:** Gestiona la obtención y cacheo de datos de analytics para un nadador específico.

#### Estructura del Hook

```typescript
export function useNadadorAnalytics(nadador?: Nadador) {
  const { user } = useAuthContext();

  return useQuery<NadadorAnalytics | null>({
    queryKey: nadadorAnalyticsKeys.detail(nadador?.id || 0),
    queryFn: async (): Promise<NadadorAnalytics | null> => {
      if (!nadador?.id) return null;
      return nadadorAnalyticsApi.get(nadador.id);
    },
    enabled: !!user && !!nadador?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error) => {
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('403'))) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
```

#### Características Clave

- **Autenticación:** Integrado con `useAuthContext`
- **Cacheo Inteligente:** 5 minutos de staleTime, 10 minutos de garbage collection
- **Manejo de Errores:** No reintentos en errores de autorización
- **Lazy Loading:** Solo se ejecuta si hay usuario y nadador válido

### 2. Cliente API: `nadadorAnalyticsApi`

**Ubicación:** `apps/web/src/hooks/useNadadorAnalytics.ts`

```typescript
const nadadorAnalyticsApi = {
  get: async (nadadorId: number): Promise<NadadorAnalytics> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/analitica/nadador/${nadadorId}/resumen`
    );
    return response;
  }
};
```

#### Función `fetchWithAuth`

- **Autenticación Automática:** Obtiene token de Supabase
- **Manejo de Errores:** Traduce errores de validación de Pydantic
- **Logging Detallado:** Para debugging y monitoreo

### 3. Tipos de Datos TypeScript

**Ubicación:** `apps/web/src/hooks/useNadadorAnalytics.ts`

```typescript
export interface NadadorAnalytics {
  nadador_id: number;
  nombre_completo: string;
  mejores_marcas: MejorMarca[];
  evolucion_temporal: EvolucionTiempo[];
  distribucion_estilos: DistribucionEstilo[];
  registros_recientes: RegistroReciente[];
  ranking_intra_equipo: RankingData;
  estadisticas_generales: EstadisticasGenerales;
}

export interface MejorMarca {
  prueba: string;
  curso: string;
  tiempo: number;
  tiempo_formateado: string;
  fecha: string;
  competencia: string;
  lugar: string;
}

// ... más interfaces
```

## 🎯 Componentes UI y Data Binding

### 1. Página Principal: `PerfilNadadorPage`

**Ubicación:** `apps/web/src/app/nadadores/[id]/page.tsx`

#### Flujo de Datos

```typescript
// 1. Obtención de datos del nadador
const { data: nadador, isLoading, isError } = useNadador(nadadorId);

// 2. Obtención de analytics (lazy loading)
const { 
  data: analytics, 
  isLoading: analyticsLoading, 
  isError: analyticsError 
} = useNadadorAnalytics(nadador);

// 3. Type guard para analytics
const analyticsData = analytics as NadadorAnalytics | null;
```

#### Sistema de Tabs

```typescript
const [activeTab, setActiveTab] = useState('informacion');

// Tabs disponibles:
// - informacion: Datos personales + estadísticas generales
// - resultados: Resumen completo (NUEVO)
// - marcas: Mejores marcas personales
// - evolucion: Evolución temporal
// - distribucion: Distribución por estilos
// - ranking: Ranking intra-equipo
```

### 2. Componente de Resultados: `ResultadosResumen`

**Ubicación:** `apps/web/src/components/nadadores/analytics/ResultadosResumen.tsx`

#### Props y Data Flow

```typescript
interface ResultadosResumenProps {
  nadador: Nadador;
  analyticsData: NadadorAnalytics | null;
  isLoading: boolean;
}

export default function ResultadosResumen({ 
  nadador, 
  analyticsData, 
  isLoading 
}: ResultadosResumenProps) {
  const [vistaDetallada, setVistaDetallada] = useState(false);
  
  // Destructuring de datos
  const { 
    estadisticas_generales, 
    mejores_marcas, 
    registros_recientes 
  } = analyticsData || {};
  
  // Generación de métricas procesadas
  const metricasDetalladas = generarMetricasDetalladas();
}
```

#### Estados de Carga y Error

```typescript
// Estado de carga
if (isLoading) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Estado sin datos
if (!analyticsData) {
  return (
    <EmptyState
      icon={Activity}
      title="Sin datos de resultados"
      description="Este nadador aún no tiene resultados registrados en el sistema."
      actions={[
        {
          label: "Registrar Resultado",
          href: "/resultados/registrar",
          variant: "default"
        }
      ]}
    />
  );
}
```

### 3. Componentes de Analytics Específicos

#### MejoresMarcas
- **Lazy Loading:** `const MejoresMarcas = lazy(() => import('./MejoresMarcas'));`
- **Data:** `analyticsData?.mejores_marcas || []`
- **Características:** Tabla responsive, badges por estilo/curso

#### EvolucionTemporal
- **Lazy Loading:** `const EvolucionTemporal = lazy(() => import('./EvolucionTemporal'));`
- **Data:** `analyticsData?.evolucion_temporal || []`
- **Características:** Gráfico de líneas con Chart.js

#### DistribucionEstilos
- **Lazy Loading:** `const DistribucionEstilos = lazy(() => import('./DistribucionEstilos'));`
- **Data:** `analyticsData?.distribucion_estilos || []`
- **Características:** Gráfico de barras/pie chart

#### RankingIntraEquipo
- **Lazy Loading:** `const RankingIntraEquipo = lazy(() => import('./RankingIntraEquipo'));`
- **Data:** `analyticsData?.ranking_intra_equipo`
- **Características:** Tabla de ranking con posiciones y estadísticas

## 🔄 Query Key Strategy

### Estructura de Claves

```typescript
export const nadadorAnalyticsKeys = {
  all: ['nadador-analytics'] as const,
  lists: () => [...nadadorAnalyticsKeys.all, 'list'] as const,
  list: (filters: string) => [...nadadorAnalyticsKeys.lists(), { filters }] as const,
  details: () => [...nadadorAnalyticsKeys.all, 'detail'] as const,
  detail: (id: number) => [...nadadorAnalyticsKeys.details(), id] as const,
};
```

### Invalidación de Cache

```typescript
// Invalidar analytics de un nadador específico
queryClient.invalidateQueries(nadadorAnalyticsKeys.detail(nadadorId));

// Invalidar todos los analytics
queryClient.invalidateQueries(nadadorAnalyticsKeys.all);
```

## 🎨 UI Components y Styling

### Sistema de Design

- **Base:** shadcn/ui components
- **Icons:** Lucide React
- **Styling:** Tailwind CSS con design system consistente
- **Responsive:** Mobile-first approach

### Componentes Reutilizables

#### EmptyState
```typescript
<EmptyState
  icon={Activity}
  title="Sin datos"
  description="Descripción del estado vacío"
  actions={[
    {
      label: "Acción Principal",
      href: "/ruta",
      variant: "default"
    }
  ]}
/>
```

#### InfoCard
```typescript
<InfoCard
  variant="success"
  title="Título"
  description="Descripción"
  items={[
    {
      label: "Campo",
      value: "Valor",
      asBadge: true,
      badgeVariant: "secondary"
    }
  ]}
/>
```

### Color Scheme y Variants

```typescript
// KPIs con gradientes específicos
const kpiVariants = {
  competencias: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
  pruebas: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
  lugar: "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900",
  eventos: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
};
```

## ⚡ Performance Optimizations

### Lazy Loading Strategy

```typescript
// Componentes pesados con lazy loading
const ResultadosResumen = lazy(() => import('./ResultadosResumen'));

// Wrapper con Suspense
<Suspense fallback={<TabLoader title="Resultados" />}>
  <ResultadosResumen 
    nadador={nadador}
    analyticsData={analyticsData}
    isLoading={analyticsLoading}
  />
</Suspense>
```

### Memoización

```typescript
// Cálculos costosos memoizados
const metricasDetalladas = useMemo(() => {
  return generarMetricasDetalladas();
}, [analyticsData]);

// Callbacks optimizados
const handleToggleDetalle = useCallback(() => {
  setVistaDetallada(prev => !prev);
}, []);
```

### Bundle Splitting

- **Lazy Loading:** Componentes de analytics cargados bajo demanda
- **Code Splitting:** Separación automática por rutas
- **Dynamic Imports:** Carga condicional de componentes complejos

## 🚨 Error Handling

### Estrategia de Errores

```typescript
// Error boundaries para componentes críticos
if (analyticsError) {
  return (
    <Alert>
      <AlertDescription>
        Error al cargar analytics. Por favor, intenta de nuevo más tarde.
      </AlertDescription>
    </Alert>
  );
}

// Retry logic en queries
retry: (failureCount, error) => {
  // No reintentar errores de autenticación
  if (error instanceof Error && 
      (error.message.includes('401') || error.message.includes('403'))) {
    return false;
  }
  return failureCount < 2;
}
```

### Estados de Error Específicos

- **401/403:** Problemas de autenticación → Redirect a login
- **404:** Nadador no encontrado → Página de error
- **422:** Validation errors → Mostrar errores específicos
- **500:** Server errors → Mensaje genérico + retry

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Tests de hooks
describe('useNadadorAnalytics', () => {
  it('should return null when no nadador provided', () => {
    const { result } = renderHook(() => useNadadorAnalytics());
    expect(result.current.data).toBeNull();
  });
});

// Tests de componentes
describe('ResultadosResumen', () => {
  it('should show loading state', () => {
    render(<ResultadosResumen isLoading={true} />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Tests de flujo completo
describe('Analytics Flow', () => {
  it('should load and display analytics data', async () => {
    // Mock API response
    // Render component
    // Wait for data
    // Assert UI state
  });
});
```

## 📊 Data Transformation

### Formateo de Datos

```typescript
// Formateo de tiempos
const formatearTiempo = (centesimas: number): string => {
  const minutos = Math.floor(centesimas / 6000);
  const segundos = Math.floor((centesimas % 6000) / 100);
  const centesimasRest = centesimas % 100;
  return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}.${centesimasRest.toString().padStart(2, '0')}`;
};

// Cálculo de métricas derivadas
const generarMetricasDetalladas = (): MetricaDetalle[] => {
  const metricas: MetricaDetalle[] = [];
  
  // Métricas automáticas del sistema
  if (estadisticas_generales) {
    metricas.push({
      label: "Total de Competencias",
      valor: estadisticas_generales.total_competencias.toString(),
      tipo: "automatica",
      descripcion: "Número total de competencias participadas"
    });
  }
  
  // Métricas manuales derivadas
  if (mejores_marcas?.length > 0) {
    const estilosUnicos = [...new Set(mejores_marcas.map(m => m.estilo))];
    metricas.push({
      label: "Especialidades",
      valor: estilosUnicos.join(", "),
      tipo: "manual",
      descripcion: "Estilos de natación con registros"
    });
  }
  
  return metricas;
};
```

## 🔗 Integration Points

### Con Otros Módulos

- **Autenticación:** `useAuthContext` para tokens y permisos
- **Navegación:** Next.js router para transiciones
- **Resultados:** `ResultadoDetailModal` para detalles específicos
- **Formularios:** Integración con stepper de registro

### Con Backend

- **Endpoints:** RESTful API con FastAPI
- **Autenticación:** Supabase JWT tokens
- **Validación:** Pydantic schemas
- **Filtros:** Query parameters opcionales

---

**Nota:** Este flujo de datos se actualiza con cada nueva feature. Para cambios recientes, consultar los commits en el repositorio.
