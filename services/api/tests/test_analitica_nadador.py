import os
import pytest
from fastapi.testclient import TestClient

# Skip completo del módulo si no hay DATABASE_URL (evita fallos en CI/local)
database_url = os.getenv("AQUALYTICS_DATABASE_URL") or os.getenv("DATABASE_URL")
if not database_url:
    pytest.skip("DATABASE_URL no configurado; omitiendo tests de integración.", allow_module_level=True)

from app.main import app
from app.models.user import Usuario
from app.api import deps as deps_module


def override_get_current_user():
    # Usuario entrenador del equipo 1 (coincide con datos reales)
    return Usuario(
        id=2,
        email="swacg08@gmail.com",
        rol="entrenador",
        equipo_id=1,
    )


def test_get_nadador_resumen_ok():
    app.dependency_overrides[deps_module.get_current_user] = override_get_current_user
    client = TestClient(app)

    # Usamos nadador 1 (equipo 1) que existe en BD
    resp = client.get("/api/v1/analitica/nadador/1/resumen")

    # Limpieza de overrides
    app.dependency_overrides.clear()

    # Debug del error si falla
    if resp.status_code != 200:
        print(f"Error {resp.status_code}: {resp.text}")
    
    assert resp.status_code == 200
    data = resp.json()

    # Claves principales del contrato
    for key in [
        "nadador_id",
        "nombre_completo",
        "mejores_marcas",
        "evolucion_temporal",
        "distribucion_estilos",
        "registros_recientes",
        "ranking_intra_equipo",
        "estadisticas_generales",
    ]:
        assert key in data

    # Listas presentes, aunque puedan estar vacías dependiendo de los datos
    assert isinstance(data["mejores_marcas"], list)
    assert isinstance(data["evolucion_temporal"], list)
    assert isinstance(data["distribucion_estilos"], list)
    assert isinstance(data["registros_recientes"], list)
