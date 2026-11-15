from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..sanitize import clean_html
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
        # [CORRECTIF V3] La bio (HTML) est assainie avant enregistrement.
        if field == "bio":
            value = clean_html(value)
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # [CORRECTIF V2] Un utilisateur ne peut consulter que son propre profil ;
    # un administrateur peut consulter n'importe quel profil.
    if user_id != current.id and current.role != "admin":
        raise HTTPException(403, "Accès refusé à ce profil")
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    return user
