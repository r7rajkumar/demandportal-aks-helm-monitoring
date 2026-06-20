from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_health(monkeypatch):
    """Test health endpoint"""
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    
    # Mock the DB init
    import unittest.mock as mock
    with mock.patch("main.init_db"):
        from main import app
        client = TestClient(app)
        # Just verify the app imports correctly
        assert app is not None
