import logging
from typing import Any, Dict, List, Optional
import pandas as pd
import pyexasol
from app.core.config import settings

logger = logging.getLogger("mindbridge.exasol")

class RealExasolClient:
    """Official Exasol Python Client implementation using pyexasol."""
    def __init__(self):
        self.host = f"{settings.EXASOL_HOST}:{settings.EXASOL_PORT}"
        self.user = settings.EXASOL_USER
        self.password = settings.EXASOL_PASSWORD
        self.schema = settings.EXASOL_SCHEMA
        self.encryption = settings.EXASOL_USE_ENCRYPTION
        self.connection: Optional[pyexasol.ExaConnection] = None
        self.is_connected = False
        self.adapter_name = "REAL_EXASOL_PYEXASOL"

    def connect(self) -> bool:
        """Establishes connection to the running Exasol instance."""
        try:
            logger.info(f"Attempting connection to Exasol at {self.host} (schema: {self.schema})...")
            self.connection = pyexasol.connect(
                dsn=self.host,
                user=self.user,
                password=self.password,
                schema=self.schema,
                encryption=self.encryption,
                connection_timeout=settings.EXASOL_CONNECTION_TIMEOUT,
                autocommit=True
            )
            self.is_connected = True
            logger.info("Successfully connected to Exasol instance.")
            return True
        except Exception as e:
            self.is_connected = False
            self.connection = None
            logger.warning(f"Could not connect to Exasol instance at {self.host}: {e}")
            return False

    def check_health(self) -> Dict[str, Any]:
        """Runs a diagnostic query to verify Exasol connectivity."""
        if not self.connection or not self.is_connected:
            return {"status": "disconnected", "adapter": self.adapter_name, "error": "No active connection"}
        try:
            stmt = self.connection.execute("SELECT 1 AS PING, CURRENT_TIMESTAMP AS SERVER_TIME, CURRENT_SCHEMA AS SCHEMA_NAME")
            row = stmt.fetchone()
            return {
                "status": "healthy",
                "adapter": self.adapter_name,
                "host": self.host,
                "schema": self.schema,
                "ping": row[0],
                "server_time": str(row[1]),
                "current_schema": row[2]
            }
        except Exception as e:
            return {"status": "unhealthy", "adapter": self.adapter_name, "error": str(e)}

    def execute(self, query: str, params: Optional[Dict[str, Any]] = None):
        """Executes a query with optional parameters."""
        if not self.connection or not self.is_connected:
            raise ConnectionError("Exasol is not connected.")
        return self.connection.execute(query, query_params=params)

    def fetch_all(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Executes query and returns all rows as list of dicts."""
        stmt = self.execute(query, params)
        cols = [col["name"].lower() for col in stmt.columns().values()]
        rows = stmt.fetchall()
        return [dict(zip(cols, row)) for row in rows]

    def fetch_one(self, query: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Executes query and returns a single row as dict."""
        stmt = self.execute(query, params)
        cols = [col["name"].lower() for col in stmt.columns().values()]
        row = stmt.fetchone()
        if not row:
            return None
        return dict(zip(cols, row))

    def export_to_pandas(self, query: str, params: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """Official pyexasol export to pandas DataFrame."""
        if not self.connection or not self.is_connected:
            raise ConnectionError("Exasol is not connected.")
        return self.connection.export_to_pandas(query, query_params=params)

    def import_from_pandas(self, df: pd.DataFrame, table_name: str):
        """Official pyexasol fast import from pandas DataFrame."""
        if not self.connection or not self.is_connected:
            raise ConnectionError("Exasol is not connected.")
        return self.connection.import_from_pandas(df, table_name)

    def close(self):
        """Closes the connection."""
        if self.connection:
            try:
                self.connection.close()
            except Exception:
                pass
            self.connection = None
            self.is_connected = False
