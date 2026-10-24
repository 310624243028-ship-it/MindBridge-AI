import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

import pytest
from starlette.testclient import TestClient
from app.main import app

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
