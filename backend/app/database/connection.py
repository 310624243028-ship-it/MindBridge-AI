import logging
from typing import Union
from app.core.config import settings
from app.database.exasol_client import RealExasolClient
from app.database.mock_exasol import ExplicitMockExasolAdapter

logger = logging.getLogger("mindbridge.database")

# Global singleton client instance
_db_instance: Union[RealExasolClient, ExplicitMockExasolAdapter, None] = None
_db_status_info = {
    "is_mock": False,
    "adapter_name": "UNINITIALIZED",
    "host": settings.EXASOL_HOST,
    "port": settings.EXASOL_PORT,
    "schema": settings.EXASOL_SCHEMA,
    "error_message": None
}

def init_db_connection() -> Union[RealExasolClient, ExplicitMockExasolAdapter]:
    """
    Initializes database connection.
    Attempts to connect to real Exasol instance first.
    If unavailable or explicitly requested, falls back to ExplicitMockExasolAdapter.
    """
    global _db_instance, _db_status_info

    if settings.USE_MOCK_EXASOL:
        logger.info("Configuration USE_MOCK_EXASOL is TRUE. Using ExplicitMockExasolAdapter.")
        _db_instance = ExplicitMockExasolAdapter()
        _db_status_info.update({
            "is_mock": True,
            "adapter_name": _db_instance.adapter_name,
            "error_message": "USE_MOCK_EXASOL enabled in configuration."
        })
        return _db_instance

    # Attempt real Exasol connection
    try:
        real_client = RealExasolClient()
        success = real_client.connect()
        if success:
            _db_instance = real_client
            _db_status_info.update({
                "is_mock": False,
                "adapter_name": real_client.adapter_name,
                "error_message": None
            })
            logger.info("Real Exasol connection established and active.")
            return _db_instance
        else:
            raise ConnectionError(f"Could not connect to Exasol server at {settings.EXASOL_HOST}:{settings.EXASOL_PORT}")
    except Exception as e:
        logger.warning(
            f"Exasol connection failed: {e}. Switching to explicitly labelled ExplicitMockExasolAdapter."
        )
        _db_instance = ExplicitMockExasolAdapter()
        _db_status_info.update({
            "is_mock": True,
            "adapter_name": _db_instance.adapter_name,
            "error_message": f"Real Exasol connection failed: {str(e)}. Running in explicit fallback mock mode."
        })
        return _db_instance

def get_db() -> Union[RealExasolClient, ExplicitMockExasolAdapter]:
    """Dependency provider for database instance."""
    global _db_instance
    if _db_instance is None:
        return init_db_connection()
    return _db_instance

def get_db_status() -> dict:
    """Returns database connection status diagnostics."""
    global _db_instance, _db_status_info
    if _db_instance is None:
        init_db_connection()
    
    health = _db_instance.check_health() if _db_instance else {"status": "uninitialized"}
    return {
        **_db_status_info,
        "health": health
    }
