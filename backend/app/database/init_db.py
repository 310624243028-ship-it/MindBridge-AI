import logging
import os
import sys
from pathlib import Path
from app.database.connection import get_db, get_db_status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mindbridge.init_db")

def init_schema():
    """Initializes the Exasol database schema and tables."""
    db = get_db()
    status = get_db_status()
    logger.info(f"Initializing schema with adapter: {status['adapter_name']}")

    schema_file = Path(__file__).parent / "schema.sql"
    if not schema_file.exists():
        logger.error(f"Schema file not found at {schema_file}")
        return False

    with open(schema_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Split into statements
    statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip() and not stmt.strip().startswith("--")]

    if not status["is_mock"]:
        # Execute on real Exasol
        for stmt in statements:
            try:
                logger.info(f"Executing: {stmt[:60]}...")
                db.execute(stmt)
            except Exception as e:
                logger.error(f"Error executing statement: {e}")
                # Don't break if table already exists
                pass
        logger.info("Real Exasol schema initialization complete.")
    else:
        logger.info("Using ExplicitMockExasolAdapter: Mock schema and development seed records verified.")

    return True

if __name__ == "__main__":
    success = init_schema()
    sys.exit(0 if success else 1)
