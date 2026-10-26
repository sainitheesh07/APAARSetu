import pytest
from fastapi import HTTPException
from starlette.requests import Request
from app.api.v1.auth import login, get_me
from app.schemas.auth import LoginRequest
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User

def test_password_hashing():
    pwd = "SecurePassword@123"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_login_success(db):
    req = LoginRequest(email="aicte.admin@apaarsetu.gov.in", password="Password@123")
    dummy_request = Request({"type": "http", "client": ("127.0.0.1", 1234)})
    res = login(req=req, request=dummy_request, db=db)
    assert res.access_token is not None
    assert res.role == "aicte_admin"
    assert res.user.email == "aicte.admin@apaarsetu.gov.in"

def test_login_invalid_password(db):
    req = LoginRequest(email="aicte.admin@apaarsetu.gov.in", password="BadPassword")
    dummy_request = Request({"type": "http", "client": ("127.0.0.1", 1234)})
    with pytest.raises(HTTPException) as exc:
        login(req=req, request=dummy_request, db=db)
    assert exc.value.status_code == 401

def test_login_institution_admin(db):
    req = LoginRequest(email="admin@iitd.ac.in", password="Password@123")
    dummy_request = Request({"type": "http", "client": ("127.0.0.1", 1234)})
    res = login(req=req, request=dummy_request, db=db)
    assert res.role == "institution_admin"
    assert res.user.institution_id is not None
