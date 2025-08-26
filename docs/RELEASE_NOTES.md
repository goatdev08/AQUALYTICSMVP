### AquaLytics MVP — Notas de Lanzamiento

Fecha: 2025-08-26
Versión: v0.1.0 (MVP)

---

### Visión General
AquaLytics es una plataforma para registrar, analizar y visualizar resultados de natación a nivel equipo. Este MVP integra frontend (Next.js 15 + Tailwind + shadcn/ui) y backend (FastAPI + PostgreSQL/Supabase), con autenticación, CRUDs principales, analytics, y CI/CD listos para producción.

---

### Módulos Principales
- **Autenticación y Roles**: Supabase Auth. Roles soportados: entrenador (RW) y atleta (R). Protección de rutas y middleware.
- **Nadadores**: CRUD completo, búsqueda por trigram, filtros, perfil con mejores marcas.
- **Competencias**: CRUD, curso (SC/LC), rango de fechas, próximas competencias.
- **Registro de Resultados (Stepper)**: Captura guiada en 4 pasos, validaciones, cálculo en tiempo real, atajos de teclado, autoguardado local.
- **Resultados (Listado con Filtros)**: Tabla con filtros avanzados, ordenamiento, paginación, acciones por fila, filtros persistentes con Zustand.
- **Resultado Detallado**: Modal de pantalla completa con segmentos ordenados y resumen global.
- **Dashboard**: KPIs, Top 5, Distribución de estilos, Atletas destacados, Actividad reciente.
- **Analítica y Comparaciones**: Pacing, Radar, Consistencia; comparación vs. promedio de equipo y entre registros del mismo nadador.
- **Landing Page**: Página informativa con tema “green” y CTA.

---

### Guía Rápida de Uso
1. **Acceso**: Inicie sesión o regístrese. El middleware direcciona al dashboard si está autenticado.
2. **Dashboard**: Revise KPIs, Top 5 y distribución de estilos. Use filtros globales persistentes.
3. **Nadadores**: Busque (typeahead), filtre y gestione el CRUD. Abra el perfil para ver mejores marcas y analytics.
4. **Competencias**: Cree/edite competencias, consulte próximas competencias.
5. **Resultados**:
   - Registre nuevos resultados con el stepper (validaciones, autoguardado, atajos).
   - Consulte el listado con filtros por prueba/competencia/nadador/rama/fecha/estado y ordenamiento.
   - Use acciones por fila: Ver detalle, Editar, Marcar para revisión (solo entrenador).
6. **Análisis**: Compare registros (pacing, radar, consistencia) vs promedio de equipo u otros registros del nadador.

---

### Roles y Permisos
- **Entrenador**: Crear/editar resultados, marcar revisión, gestionar nadadores y competencias.
- **Atleta**: Lectura de datos, sin edición.

---

### Atajos de Teclado (Stepper de Resultados)
- Enter: siguiente campo
- Ctrl+S: guardar
- Alt+D: duplicar fila previa
- Alt+↑/↓: navegar segmentos

---

### Temas, UI/UX y Accesibilidad
- Tema “green” con soporte claro/oscuro, persistido mediante toggle global.
- Componentes basados en shadcn/ui, microinteracciones sutiles.
- Accesibilidad: contraste, estados de foco visibles, navegación por teclado, skip links.

---

### API (FastAPI)
- Base: `/api/v1`
- Principales endpoints:
  - `GET /resultados` (filtros avanzados, orden, paginación)
  - `GET /resultados/{id}` (detalle completo con segmentos y resumen)
  - `POST /resultados` (creación transaccional con validaciones)
  - `PATCH /resultados/{id}/revisar` (toggle revisión, entrenador)
  - `GET /dashboard/*` (resumen, top 5, distribución, etc.)
  - `GET /analitica/*` (promedio equipo, comparaciones)

---

### Salud y Seguridad
- Healthchecks: `GET /health` (rápido), `GET /health/detailed` (incluye DB), `GET /ready` (readiness).
- CORS estricto (dominios permitidos), middlewares de seguridad y logging con request-id.

---

### Base de Datos y Rendimiento
- PostgreSQL (Supabase) con vistas y funciones derivadas.
- Índices compuestos optimizados para `/resultados` (consultar `database/ddl/migrate_optimize_resultados_query_indexes.sql`).
- Objetivo de latencia: < 300 ms en listados con filtros.

---

### Despliegue y CI/CD
- **Frontend**: Vercel (ver `VERCEL_SETUP.md`).
- **Backend**: Render/Fly.io/Docker (ver `BACKEND_DEPLOYMENT.md`).
- **CI/CD**: GitHub Actions con lint, build, seguridad y auto-deploy (ver `GITHUB_ACTIONS_SETUP.md`).

---

### Configuración (Variables Clave)
- Frontend: Supabase URL/Anon Key, API base.
- Backend: `AQUALYTICS_API_V1_STR`, `AQUALYTICS_DATABASE_URL`, `ALLOWED_ORIGINS`, `SUPABASE_JWT_SECRET`, `SECRET_KEY`.

---

### Resolución de Problemas
- Ver `HEALTHCHECK_CORS_GUIDE.md` para CORS y healthchecks.
- Consultar logs de Actions y health endpoints tras despliegues.
- Validar orígenes CORS cuando el frontend no comunica con API.

---

### Roadmap (Post-MVP sugerido)
- Exportaciones (CSV/Excel), compartición segura de reportes.
- Más métricas avanzadas de consistencia y técnica.
- Auditoría detallada y notificaciones.

---

### Créditos
Monorepo: `apps/web` (Next.js) y `services/api` (FastAPI). Diseño guiado por Figma y shadcn/ui.


