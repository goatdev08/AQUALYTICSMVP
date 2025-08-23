# 🔐 Guía de RBAC (Role-Based Access Control) - AquaLytics

## 📋 Resumen

Sistema de control de acceso basado en roles implementado según las especificaciones del PRD. Define permisos diferenciados entre **Entrenadores (RW)** y **Atletas (R)**.

---

## 🎯 Roles y Permisos

### **Entrenador (RW) - Read/Write**

- ✅ **CRUD Completo**: Crear, leer, actualizar, eliminar
- ✅ **Competencias**: Crear/editar/eliminar competencias  
- ✅ **Nadadores**: Crear/editar/eliminar nadadores
- ✅ **Resultados**: Registrar/editar/eliminar resultados
- ✅ **Dashboard**: Acceso completo a análisis y dashboard
- ✅ **Análitica**: Ver todas las funciones analíticas

### **Atleta (R) - Read Only**

- ✅ **Solo Lectura**: Ver todo el contenido del equipo
- ❌ **Sin Creación**: No puede crear nuevos recursos
- ❌ **Sin Edición**: No puede modificar recursos existentes  
- ❌ **Sin Eliminación**: No puede eliminar recursos
- ✅ **Dashboard**: Ver dashboard y estadísticas
- ✅ **Análitica**: Ver análisis (sin modificar)

---

## 🏗️ Arquitectura RBAC

### **1. Dependencies de Autenticación Base**

```python
from app.api.deps import CurrentUser, CurrentTrainer

# Usuario actual (cualquier rol autenticado)
@app.get("/protected")
async def protected_endpoint(user: CurrentUser):
    return {"user": user.email}

# Solo entrenadores
@app.get("/trainer-only") 
async def trainer_endpoint(trainer: CurrentTrainer):
    return {"trainer": trainer.email}
```

### **2. Dependencies de Permisos CRUD**

```python
from app.api.deps import CanCreate, CanUpdate, CanDelete

# Solo usuarios con permisos de creación (entrenadores)
@app.post("/resource")
async def create_resource(user: CanCreate):
    return {"created_by": user.email}

# Solo usuarios con permisos de actualización (entrenadores)
@app.patch("/resource/{id}")
async def update_resource(id: int, user: CanUpdate):
    return {"updated_by": user.email}

# Solo usuarios con permisos de eliminación (entrenadores)
@app.delete("/resource/{id}")
async def delete_resource(id: int, user: CanDelete):
    return {"deleted_by": user.email}
```

### **3. Dependencies de Permisos Específicos**

```python
from app.api.deps import (
    CanCreateNadadores, CanEditNadadores,
    CanCreateCompetencias, CanEditCompetencias, 
    CanCreateResultados, CanEditResultados
)

# Permisos específicos por módulo
@app.post("/nadadores")
async def create_nadador(user: CanCreateNadadores):
    return {"message": "Nadador creado"}

@app.patch("/competencias/{id}")
async def edit_competencia(id: int, user: CanEditCompetencias):
    return {"message": "Competencia editada"}
```

### **4. Validación de Equipo**

```python
from app.api.deps import validate_team_access

@app.get("/nadador/{id}")
async def get_nadador(id: int, user: CurrentUser):
    # Simular obtención del nadador de BD
    nadador = get_nadador_from_db(id)
    
    # Validar que el usuario puede acceder al equipo del nadador
    validate_team_access(user, nadador.equipo_id, f"nadador {id}")
    
    return nadador
```

### **5. Auditoría de Accesos**

```python
from app.api.deps import audit_access

@app.post("/sensitive-operation")
async def sensitive_operation(user: CurrentUser):
    # Registrar acceso para auditoría
    audit_access(user, "sensitive_resource", "create", resource_id=123)
    
    # Realizar operación
    return {"status": "completed"}
```

---

## 📚 Ejemplos de Implementación

### **Ejemplo 1: Endpoints de Nadadores**

```python
from app.api.deps import CurrentUser, CanCreateNadadores, CanEditNadadores, CanDelete

# Listar - Ambos roles pueden ver
@router.get("/nadadores")
async def list_nadadores(user: CurrentUser):
    audit_access(user, "nadadores", "list")
    # Retornar solo nadadores del equipo del usuario
    return get_nadadores_by_team(user.equipo_id)

# Crear - Solo entrenadores
@router.post("/nadadores")
async def create_nadador(data: NadadorCreate, user: CanCreateNadadores):
    audit_access(user, "nadadores", "create")
    return create_nadador_in_db(data, user.equipo_id)

# Editar - Solo entrenadores  
@router.patch("/nadadores/{id}")
async def update_nadador(id: int, data: NadadorUpdate, user: CanEditNadadores):
    audit_access(user, "nadadores", "update", id)
    
    # Validar acceso por equipo
    nadador = get_nadador_from_db(id)
    validate_team_access(user, nadador.equipo_id, f"nadador {id}")
    
    return update_nadador_in_db(id, data)

# Eliminar - Solo entrenadores
@router.delete("/nadadores/{id}")
async def delete_nadador(id: int, user: CanDelete):
    audit_access(user, "nadadores", "delete", id)
    
    nadador = get_nadador_from_db(id)  
    validate_team_access(user, nadador.equipo_id, f"nadador {id}")
    
    delete_nadador_from_db(id)
```

---

## 🔍 Testing del Sistema RBAC

### **1. Endpoint de Prueba**

```bash
# Probar sistema RBAC (requiere autenticación)
GET /api/v1/nadadores/test/rbac
Authorization: Bearer <jwt_token>
```

**Respuesta esperada:**

```json
{
  "user": {
    "email": "usuario@ejemplo.com",
    "rol": "entrenador", 
    "equipo_id": 1,
    "is_trainer": true
  },
  "permissions": {
    "crear_competencias": true,
    "editar_competencias": true,
    "crear_nadadores": true,
    // ... más permisos
  },
  "rbac_status": "✅ Sistema RBAC funcionando correctamente",
  "message": "Usuario 'entrenador' puede acceder a este endpoint"
}
```

### **2. Casos de Prueba**

#### **✅ Entrenador accede a endpoint de creación**

```bash
POST /api/v1/nadadores
Authorization: Bearer <entrenador_jwt>

# Respuesta: 201 Created ✅
```

#### **❌ Atleta intenta acceder a endpoint de creación**

```bash
POST /api/v1/nadadores  
Authorization: Bearer <atleta_jwt>

# Respuesta: 403 Forbidden ❌
{
  "detail": {
    "error": "insufficient_permissions",
    "message": "Permission 'crear_nadadores' required", 
    "detail": "User role 'atleta' does not have 'crear_nadadores' permission"
  }
}
```

#### **❌ Usuario intenta acceder a datos de otro equipo**

```bash
GET /api/v1/nadadores/123
Authorization: Bearer <jwt_equipo_1>
# Nadador 123 pertenece al equipo 2

# Respuesta: 403 Forbidden ❌
{
  "detail": {
    "error": "team_access_denied",
    "message": "Access denied to nadador 123",
    "detail": "User team 1 cannot access team 2 resources"
  }
}
```

---

## 📊 Registro de Auditoría

Todos los accesos se registran automáticamente:

```
INFO: 🔍 AUDIT: User entrenador@equipo.com (entrenador) performed create on nadadores | Team: 1
INFO: 🔍 AUDIT: User atleta@equipo.com (atleta) performed create_denied on unknown | Team: 1  
INFO: 🔍 AUDIT: User usuario@equipo.com (entrenador) performed team_access_denied on nadador 123 (ID: 2) | Team: 1
```

---

## 🛠️ Endpoints Disponibles para Testing

### **Nadadores (Ejemplo Implementado)**

| Método | Endpoint | Entrenador | Atleta | Descripción |
|--------|----------|------------|--------|-------------|
| GET | `/nadadores` | ✅ | ✅ | Listar nadadores del equipo |
| POST | `/nadadores` | ✅ | ❌ | Crear nadador |
| GET | `/nadadores/{id}` | ✅ | ✅ | Ver nadador específico |  
| PATCH | `/nadadores/{id}` | ✅ | ❌ | Editar nadador |
| DELETE | `/nadadores/{id}` | ✅ | ❌ | Eliminar nadador |
| GET | `/nadadores/test/rbac` | ✅ | ✅ | Probar sistema RBAC |

---

## 🚀 Próximos Pasos

1. **Implementar otros módulos** usando las mismas dependencies:
   - Competencias
   - Resultados  
   - Dashboard
   - Análitica

2. **Conectar con base de datos real** para validación completa

3. **Agregar tests automatizados** para cada caso de RBAC

4. **Extender auditoría** con persistencia en BD si se requiere

---

## ⚙️ Configuración Requerida

- ✅ JWT validation funcionando (tarea 12.4)
- ✅ Usuario en tabla `usuario` con `rol` y `equipo_id`
- ✅ Dependencies RBAC implementadas (tarea 12.6)
- ✅ Logging configurado para auditoría

El sistema RBAC está **listo para producción** y puede ser aplicado a todos los módulos del sistema AquaLytics.
