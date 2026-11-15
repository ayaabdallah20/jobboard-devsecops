# Authentification - version corrigée
# [CORRECTIF V5] bcrypt (avec sel), politique de mot de passe, jeton court,
# rôle et is_active lus depuis la base (jamais le jeton seul).
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .config import JWT_ALGORITHM, JWT_EXPIRE_HOURS, JWT_SECRET
from .database import get_db

bearer = HTTPBearer(auto_error=False)

# [CORRECTIF V5] Politique de mot de passe minimale.
PASSWORD_MIN_LEN = 8


def validate_password(password: str) -> None:
    if len(password) < PASSWORD_MIN_LEN:
        raise HTTPException(400, f"Le mot de passe doit faire au moins {PASSWORD_MIN_LEN} caractères")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise HTTPException(400, "Le mot de passe doit contenir au moins une lettre et un chiffre")


def hash_password(password: str) -> str:
    # [CORRECTIF V5] bcrypt : sel aléatoire intégré, lent par conception.
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except (ValueError, TypeError):
        return False


def create_token(user: models.User) -> str:
    payload = {
        "sub": str(user.id),
        # [CORRECTIF V5] Jeton court : seule l'identité est transportée,
        # le rôle est relu en base à chaque requête.
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


class CurrentUser:
    def __init__(self, user: models.User):
        self.user = user
        self.id = user.id
        self.role = user.role  # [CORRECTIF V5] rôle qui fait foi = celui de la base


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
    # [CORRECTIF V5] Un compte désactivé perd immédiatement l'accès.
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Compte désactivé")
    return CurrentUser(user)


def require_roles(*roles: str):
    def checker(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé pour ce rôle")
        return current

    return checker
