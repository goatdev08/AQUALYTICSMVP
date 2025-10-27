"""
Configuración global de la aplicación AquaLytics API.

Utiliza pydantic-settings para manejo de variables de entorno.
"""

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configuración global de la aplicación.

    Carga automáticamente desde variables de entorno con prefijo AQUALYTICS_
    """

    # Configuración básica de la aplicación
    ENVIRONMENT: str = Field(default="development", description="Entorno de ejecución")
    DEBUG: bool = Field(default=True, description="Modo debug")
    API_V1_STR: str = Field(default="/api/v1", description="Prefijo de API v1")

    # Base de datos - PostgreSQL/Supabase
    DATABASE_URL: str = Field(
        description="URL de conexión a PostgreSQL (formato: postgresql://user:pass@host:port/db)"
    )

    # CORS - Orígenes permitidos para el frontend
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Orígenes permitidos para CORS (separados por comas)",
    )

    # Seguridad JWT
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production",
        description="Clave secreta para JWT (cambiar en producción)",
    )
    ALGORITHM: str = Field(default="HS256", description="Algoritmo para JWT")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, description="Tiempo de expiración del token en minutos"
    )

    # Configuración de Supabase (opcional para validar JWT)
    SUPABASE_URL: str | None = Field(
        default=None, description="URL de proyecto Supabase"
    )
    SUPABASE_JWT_SECRET: str | None = Field(
        default=None, description="Secret para validar JWT de Supabase"
    )

    # Configuración de logging
    LOG_LEVEL: str = Field(default="INFO", description="Nivel de logging")

    # Configuración de paginación
    DEFAULT_PAGE_SIZE: int = Field(
        default=20, description="Tamaño de página por defecto"
    )
    MAX_PAGE_SIZE: int = Field(default=100, description="Tamaño máximo de página")

    @property
    def cors_origins(self) -> list[str]:
        """
        Obtiene lista de orígenes CORS desde string separado por comas.

        Returns:
            List[str]: Lista de orígenes permitidos para CORS
        """
        if isinstance(self.ALLOWED_ORIGINS, str) and self.ALLOWED_ORIGINS:
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        return ["http://localhost:3000"]

    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """
        Valida que el entorno sea válido.

        Args:
            v: Valor del entorno

        Returns:
            str: Entorno validado
        """
        allowed_envs = ["development", "testing", "staging", "production"]
        if v not in allowed_envs:
            raise ValueError(f"ENVIRONMENT debe ser uno de: {allowed_envs}")
        return v

    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """
        Valida que el nivel de logging sea válido.

        Args:
            v: Nivel de logging

        Returns:
            str: Nivel de logging validado
        """
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"LOG_LEVEL debe ser uno de: {allowed_levels}")
        return v.upper()

    @validator("SECRET_KEY")
    def validate_secret_key(cls, v, values):
        """
        Valida que la clave secreta JWT sea segura en producción.

        Args:
            v: Valor de la clave secreta
            values: Otros valores del modelo

        Returns:
            str: Clave secreta validada

        Raises:
            ValueError: Si la clave es insegura en producción
        """
        environment = values.get("ENVIRONMENT", "development")
        
        # En producción, la clave no puede ser la default
        if environment == "production" and v == "dev-secret-key-change-in-production":
            raise ValueError(
                "SECRET_KEY must be changed from default value in production environment. "
                "Set AQUALYTICS_SECRET_KEY environment variable with a secure random string."
            )
        
        # Validar longitud mínima en cualquier entorno
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters long for security. "
                "Generate a secure key using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
            
        # Advertir sobre claves débiles
        weak_keys = [
            "dev-secret-key-change-in-production",
            "secret",
            "password",
            "123456",
            "change-me"
        ]
        
        if v.lower() in [key.lower() for key in weak_keys]:
            import warnings
            warnings.warn(
                f"Using weak SECRET_KEY: '{v[:10]}...'. "
                "Consider using a cryptographically secure random key.",
                UserWarning
            )
        
        return v

    class Config:
        """Configuración de pydantic-settings."""

        env_prefix = "AQUALYTICS_"
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()
