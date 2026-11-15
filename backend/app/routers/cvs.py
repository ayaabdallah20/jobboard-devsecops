import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import models
from ..config import UPLOAD_DIR
from ..database import get_db
from ..schemas import CVOut
from ..security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/cvs", tags=["CV"])


@router.post("/upload", response_model=CVOut, status_code=201)
async def upload_cv(file: UploadFile = File(...), current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # [VULN V4] upload non sécurisé : pas de contrôle extension/type/taille,
    # nom client réutilisé tel quel (écrasement, ../), dossier /uploads public
    content = await file.read()
    filename = file.filename or "cv"
    dest = os.path.join(UPLOAD_DIR, filename)  # nom client non assaini
    os.makedirs(os.path.dirname(dest) or UPLOAD_DIR, exist_ok=True)
    with open(dest, "wb") as f:
        f.write(content)

    cv = models.CV(
        owner_id=current.id,
        original_filename=filename,
        stored_path=f"/uploads/{filename}",  # URL publique, sans authentification
        content_type=file.content_type,  # type déclaré par le client, non vérifié
        size=len(content),
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


@router.get("/mine", response_model=list[CVOut])
def my_cvs(current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.CV).filter(models.CV.owner_id == current.id).order_by(models.CV.uploaded_at.desc()).all()


@router.get("/{cv_id}", response_model=CVOut)
def cv_info(cv_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # [VULN V2] IDOR : métadonnées de n'importe quel CV
    cv = db.get(models.CV, cv_id)
    if not cv:
        raise HTTPException(404, "CV introuvable")
    return cv


@router.get("/{cv_id}/download")
def download_cv(cv_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # [VULN V2] IDOR : aucune vérification que le CV appartient à l'utilisateur
    # ou est lié à une offre du recruteur -> /api/cvs/1/download, /2/download, ...
    cv = db.get(models.CV, cv_id)
    if not cv:
        raise HTTPException(404, "CV introuvable")
    path = os.path.join(UPLOAD_DIR, cv.original_filename)
    if not os.path.exists(path):
        raise HTTPException(404, "Fichier manquant")
    return FileResponse(path, filename=os.path.basename(cv.original_filename), media_type=cv.content_type or "application/octet-stream")


@router.delete("/{cv_id}")
def delete_cv(cv_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = db.get(models.CV, cv_id)
    if not cv or cv.owner_id != current.id:
        raise HTTPException(404, "CV introuvable")
    db.query(models.Application).filter(models.Application.cv_id == cv_id).update({"cv_id": None})
    db.delete(cv)
    db.commit()
    return {"detail": "CV supprimé"}
