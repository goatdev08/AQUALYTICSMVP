# 📁 Legacy Files Archive

## Propósito

Este directorio contiene archivos de demostración y ejemplos que fueron utilizados durante el desarrollo de AquaLytics pero que ya no forman parte del código de producción.

## Archivos Archivados

### `coeficiente-variacion-ejemplo.ts`
- **Descripción:** Ejemplos prácticos del cálculo del coeficiente de variación para demostrar cómo se mide la consistencia en natación
- **Tipo:** Utilidad matemática con datos de ejemplo
- **Razón de archivo:** No se usa en la interfaz de usuario, solo para referencia matemática
- **Fecha de archivo:** 2025-08-26

### `cv-demo.js`
- **Descripción:** Demostración del cálculo del coeficiente de variación con logging de consola
- **Tipo:** Script de demostración
- **Razón de archivo:** Archivo de prueba/demostración no utilizado en producción
- **Fecha de archivo:** 2025-08-26

### `CompetenciaSelectorExample.tsx`
- **Descripción:** Ejemplo de uso del CompetenciaSelector como referencia para desarrolladores
- **Tipo:** Componente de ejemplo/documentación
- **Razón de archivo:** Componente de ejemplo que no se usa en la aplicación
- **Fecha de archivo:** 2025-08-26

## Política de Archivos Legacy

### ✅ Archivos Seguros para Archivar
- Archivos de ejemplo que no se importan en código de producción
- Utilidades matemáticas de referencia
- Componentes de demostración
- Scripts de prueba standalone

### ⚠️ Archivos que NO se Archivan
- Archivos con imports activos en código de producción
- Utilidades utilizadas por componentes UI
- Configuraciones del sistema
- Tests unitarios

## Verificación de Seguridad

Antes de archivar cualquier archivo, se verifica que:

1. ✅ No existan imports/referencias en el código de producción
2. ✅ No sean dependencias de otros componentes
3. ✅ No afecten la funcionalidad del sistema
4. ✅ No sean parte de tests unitarios activos

## Acceso a Archivos Legacy

Si necesitas consultar estos archivos:

1. **Para referencia matemática:** Consultar `coeficiente-variacion-ejemplo.ts` para entender cálculos de consistencia
2. **Para ejemplos de componentes:** Revisar `CompetenciaSelectorExample.tsx` como guía de implementación
3. **Para debugging:** Usar `cv-demo.js` como referencia de cálculos paso a paso

## Restauración

Si necesitas restaurar algún archivo:

```bash
# Ejemplo para restaurar un archivo
cp docs/legacy/archivo-necesario.ts apps/web/src/lib/
```

**Importante:** Antes de restaurar, verificar que el archivo sigue siendo compatible con la versión actual del código.

---

**Última actualización:** 2025-08-26  
**Responsable:** Sistema de migración de datos reales v1
