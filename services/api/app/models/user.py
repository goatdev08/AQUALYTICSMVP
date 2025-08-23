"""
Modelos de base de datos para usuarios y autenticación.

Define las tablas relacionadas con usuarios según el PRD.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import SQLModel, Field


class Usuario(SQLModel, table=True):
    """
    Modelo para la tabla 'usuario'.
    
    Almacena información de usuarios del sistema con referencia a Supabase Auth.
    Coincide exactamente con la tabla existente en Supabase.
    """
    
    __tablename__ = "usuario"

    # Campos principales - deben coincidir EXACTAMENTE con la tabla de Supabase
    id: int = Field(primary_key=True)
    
    auth_user_id: Optional[UUID] = Field(
        default=None,
        unique=True,
        index=True,
        description="ID del usuario en Supabase Auth (referencia a auth.users.id)"
    )
    
    email: str = Field(
        unique=True,
        index=True,
        description="Email del usuario (sincronizado con Supabase Auth)"
    )
    
    rol: str = Field(
        index=True,
        description="Rol del usuario: entrenador (RW) o atleta (R)"
    )
    
    equipo_id: int = Field(
        index=True,
        description="ID del equipo al que pertenece el usuario"
    )

    # Timestamps - opcionales según la tabla real
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)

    def __repr__(self) -> str:
        """Representación string del usuario."""
        return f"<Usuario(id={self.id}, email='{self.email}', rol='{self.rol}')>"

    @property
    def is_trainer(self) -> bool:
        """
        Verifica si el usuario es entrenador.
        
        Returns:
            bool: True si es entrenador, False si es atleta
        """
        return self.rol == "entrenador"

    @property
    def permissions(self) -> dict[str, bool]:
        """
        Obtiene los permisos del usuario según su rol.
        
        Returns:
            dict: Diccionario con permisos según PRD
        """
        if self.is_trainer:
            # Entrenador (RW): acceso completo según PRD
            return {
                "crear_competencias": True,
                "editar_competencias": True,
                "eliminar_competencias": True,
                "crear_nadadores": True,
                "editar_nadadores": True,
                "eliminar_nadadores": True,
                "registrar_resultados": True,
                "editar_resultados": True,
                "eliminar_resultados": True,
                "ver_dashboard": True,
                "ver_analitica": True,
                "acceso_completo": True,
            }
        else:
            # Atleta (R): solo lectura según PRD
            return {
                "crear_competencias": False,
                "editar_competencias": False,
                "eliminar_competencias": False,
                "crear_nadadores": False,
                "editar_nadadores": False,
                "eliminar_nadadores": False,
                "registrar_resultados": False,
                "editar_resultados": False,
                "eliminar_resultados": False,
                "ver_dashboard": True,     # Puede ver dashboard
                "ver_analitica": True,     # Puede ver análisis
                "acceso_completo": False,
            }
