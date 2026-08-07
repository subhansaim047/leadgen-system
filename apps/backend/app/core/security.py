"""Security utilities — API token verification."""
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings

security = HTTPBearer(auto_error=False)


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify Bearer token for protected endpoints."""
    if not credentials or credentials.credentials != settings.API_SECRET_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API token",
        )
    return True
