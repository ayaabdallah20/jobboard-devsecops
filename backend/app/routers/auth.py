import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import LoginIn, RegisterIn, UserOut
from ..security import CurrentUser, create_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentification"])
log = logging.getLogger("jobboard.auth")


@router.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    # [VULN V5] pas de politique de MDP, et le rôle client est accepté (-> admin possible)
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(400, f"Un compte existe déjà avec l'adresse {data.email}")  # énumération
    user = models.User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        company=data.company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user), "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    # [VULN V6] Le mot de passe saisi est écrit en clair dans les journaux
    log.info("Tentative de connexion email=%s password=%s", data.email, data.password)

    # [VULN V5] Aucune limitation de tentatives (brute force possible)
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        # [VULN V5] Message différent -> énumération des comptes
        raise HTTPException(404, "Aucun compte associé à cette adresse e-mail")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(403, "Compte désactivé")
    return {"access_token": create_token(user), "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.post("/logout")
def logout(current: CurrentUser = Depends(get_current_user)):
    # [VULN V5] jeton non révoqué : reste valable 30 jours
    return {"detail": "Déconnecté"}


@router.get("/me", response_model=UserOut)
def me(current: CurrentUser = Depends(get_current_user)):
    return current.user
