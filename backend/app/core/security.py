import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Any, Union
import bcrypt
from jose import jwt
from app.config import settings

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], role: str, institution_id: Optional[int] = None, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "institution_id": institution_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def mask_apaar_id(apaar_id: str) -> str:
    """Masks a 12-digit APAAR ID into format 'XXXX-XXXX-1234'"""
    if not apaar_id:
        return "N/A"
    cleaned = "".join([c for c in str(apaar_id) if c.isdigit()])
    if len(cleaned) == 12:
        return f"XXXX-XXXX-{cleaned[-4:]}"
    elif len(cleaned) >= 4:
        return f"{'X' * (len(cleaned) - 4)}{cleaned[-4:]}"
    return "XXXX"

def hash_apaar_id(apaar_id: str) -> str:
    """
    Computes a privacy-preserving keyed HMAC-SHA256 fingerprint of the APAAR ID.
    Enables secure duplicate indexing and cross-institution detection without storing plaintext.
    """
    if not apaar_id:
        return ""
    cleaned = "".join([c for c in str(apaar_id) if c.isdigit()])
    return hmac.new(settings.SECRET_KEY.encode(), cleaned.encode(), hashlib.sha256).hexdigest()
