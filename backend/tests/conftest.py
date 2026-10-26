import pytest
from app.core.database import SessionLocal
from app.scripts.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    seed_database()
    yield

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
