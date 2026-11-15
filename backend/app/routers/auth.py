import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import LoginIn, RegisterIn, UserOut
from ..security import (
    CurrentUser,
    create_token,
    get_current_user,
    hash_password,
    validate_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentification"])
log = logging.getLogger("jobboard.auth")

# [CORRECTIF V5] Limitation anti-force-brute : max 5 échecs / 5 min par IP.
_FAILS: dict[str, list[float]] = {}
_MAX_FAILS = 5
_WINDOW = 300


def _too_many(ip: str) -> bool:
    now = time.time()
    attempts = [t for t in _FAILS.get(ip, []) if now - t < _WINDOW]
    _FAILS[ip] = attempts
    return len(attempts) >= _MAX_FAILS


def _record_fail(ip: str) -> None:
    _FAILS.setdefault(ip, []).append(time.time())


@router.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    # [CORRECTIF V5] Politique de mot de passe appliquée.
    validate_password(data.password)
    if db.query(models.User).filter(models.User.email == data.email).first():
        # [CORRECTIF V5] Message neutre : ne confirme pas l'existence du compte.
        raise HTTPException(400, "Inscription impossible avec ces informations")
    # [CORRECTIF V5] Le rôle n'est JAMAIS choisi par le client : toujours "candidat".
    # Seul un administrateur peut promouvoir un compte (PATCH /api/admin/users).
    user = models.User(
        email=str(data.email),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="candidat",
        company=data.company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user), "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.post("/login")
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "-"
    # [CORRECTIF V6] On ne journalise jamais le mot de passe ni la query-string.
    log.info("Tentative de connexion email=%s ip=%s", data.email, ip)

    # [CORRECTIF V5] Blocage temporaire après trop d'échecs.
    if _too_many(ip):
        raise HTTPException(429, "Trop de tentatives, réessayez dans quelques minutes")

    user = db.query(models.User).filter(models.User.email == data.email).first()
    # [CORRECTIF V5] Message identique que l'e-mail existe ou non (anti-énumération).
    if not user or not verify_password(data.password, user.password_hash):
        _record_fail(ip)
        raise HTTPException(401, "E-mail ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(403, "Compte désactivé")
    return {"access_token": create_token(user), "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.post("/logout")
def logout(current: CurrentUser = Depends(get_current_user)):
    # Jeton de courte durée (8 h) : la déconnexion est gérée côté client.
    return {"detail": "Déconnecté"}


@router.get("/me", response_model=UserOut)
def me(current: CurrentUser = Depends(get_current_user)):
    return current.user
