# Authentification - [VULN V5] MD5 sans sel, pas de politique MDP,
# JWT à secret faible valable 30j, rôle lu depuis le jeton.
import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .config import JWT_ALGORITHM, JWT_EXPIRE_DAYS, JWT_SECRET
from .database import get_db

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    # [VULN V5] MD5 sans sel : réversible par tables arc-en-ciel
    return hashlib.md5(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def create_token(user: models.User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,  # [VULN V5] rôle embarqué dans le jeton
        "name": user.full_name,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


class CurrentUser:
    def __init__(self, user: models.User, role: str):
        self.user = user
        self.id = user.id
        self.role = role  # vient du JWT, pas de la base


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification requise")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Jeton expiré")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Jeton invalide")

    user = db.get(models.User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilisateur introuvable")
    # [VULN V5] is_active pas vérifié : un compte désactivé garde l'accès
    return CurrentUser(user, payload.get("role", user.role))


def require_roles(*roles: str):
    def checker(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé pour ce rôle")
        return current

    return checker
