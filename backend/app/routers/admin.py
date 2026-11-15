import os
import platform
import sys

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import config, models
from ..database import get_db
from ..schemas import AdminUserPatch, UserOut
from ..security import CurrentUser, require_roles

router = APIRouter(tags=["Administration"])


@router.get("/api/admin/users", response_model=list[UserOut])
def list_users(current: CurrentUser = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.id).all()


@router.patch("/api/admin/users/{user_id}", response_model=UserOut)
def patch_user(user_id: int, data: AdminUserPatch, current: CurrentUser = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        if data.role not in ("candidat", "recruteur", "admin"):
            raise HTTPException(400, "Rôle invalide")
        user.role = data.role
    db.commit()
    db.refresh(user)
    return user


@router.get("/api/admin/stats")
def stats(current: CurrentUser = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    by_role = dict(db.query(models.User.role, func.count(models.User.id)).group_by(models.User.role).all())
    by_status = dict(db.query(models.Application.status, func.count(models.Application.id)).group_by(models.Application.status).all())
    jobs_by_status = dict(db.query(models.Job.status, func.count(models.Job.id)).group_by(models.Job.status).all())
    return {
        "users": db.query(models.User).count(),
        "users_by_role": by_role,
        "jobs": db.query(models.Job).count(),
        "jobs_by_status": jobs_by_status,
        "applications": db.query(models.Application).count(),
        "applications_by_status": by_status,
        "cvs": db.query(models.CV).count(),
    }


@router.get("/api/debug/config", tags=["Debug"])
def debug_config():
    # [VULN V6] endpoint de debug oublié, sans auth, expose la config
    return {
        "app": config.APP_NAME,
        "version": config.APP_VERSION,
        "debug": config.DEBUG,
        "database_url": config.DATABASE_URL,
        "jwt_secret": config.JWT_SECRET,
        "jwt_algorithm": config.JWT_ALGORITHM,
        "smtp_api_key": config.SMTP_API_KEY,
        "upload_dir": config.UPLOAD_DIR,
        "python": sys.version,
        "platform": platform.platform(),
        "env": {k: v for k, v in os.environ.items() if k.startswith(("DATABASE", "JWT", "POSTGRES", "APP"))},
    }
