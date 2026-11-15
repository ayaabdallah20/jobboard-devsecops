from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import ProfileIn, UserOut
from ..security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/users", tags=["Utilisateurs"])


@router.get("/me/profile", response_model=UserOut)
def my_profile(current: CurrentUser = Depends(get_current_user)):
    return current.user


@router.put("/me/profile", response_model=UserOut)
def update_profile(data: ProfileIn, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(models.User, current.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        # [VULN V3] La bio (HTML) est enregistrée sans assainissement
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # [VULN V2] IDOR : profil complet de n'importe quel utilisateur
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    return user
