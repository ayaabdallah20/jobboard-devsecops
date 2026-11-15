import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import models
from ..config import ALLOWED_CV_EXTENSIONS, ALLOWED_CV_MIME, MAX_CV_SIZE, UPLOAD_DIR
from ..database import get_db
from ..schemas import CVOut
from ..security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/cvs", tags=["CV"])

# Signatures de fichiers attendues (magic bytes) pour confirmer le type réel.
_PDF_MAGIC = b"%PDF-"
_ZIP_MAGIC = b"PK\x03\x04"  # .docx est une archive ZIP
_DOC_MAGIC = b"\xd0\xcf\x11\xe0"  # ancien format .doc (OLE)


def _can_access_cv(cv: models.CV, current: CurrentUser, db: Session) -> bool:
    # [CORRECTIF V2] Le propriétaire y a toujours accès ; un recruteur seulement
    # si le CV a été joint à une candidature sur l'une de SES offres. Admin : tout.
    if cv.owner_id == current.id or current.role == "admin":
        return True
    if current.role == "recruteur":
        link = (
            db.query(models.Application)
            .join(models.Job, models.Application.job_id == models.Job.id)
            .filter(models.Application.cv_id == cv.id, models.Job.recruiter_id == current.id)
            .first()
        )
        return link is not None
    return False


@router.post("/upload", response_model=CVOut, status_code=201)
async def upload_cv(file: UploadFile = File(...), current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # [CORRECTIF V4] Validation extension + type MIME + taille + signature,
    # nom de stockage aléatoire (plus de ../ ni d'écrasement), hors dossier public.
    original = os.path.basename(file.filename or "cv")
    ext = os.path.splitext(original)[1].lower()
    if ext not in ALLOWED_CV_EXTENSIONS:
        raise HTTPException(400, "Format non autorisé (PDF, DOC ou DOCX uniquement)")
    if file.content_type not in ALLOWED_CV_MIME:
        raise HTTPException(400, "Type de fichier non autorisé")

    content = await file.read()
    if len(content) > MAX_CV_SIZE:
        raise HTTPException(413, "Fichier trop volumineux (5 Mo maximum)")
    if len(content) == 0:
        raise HTTPException(400, "Fichier vide")
    # Vérification de la signature réelle du fichier.
    if ext == ".pdf" and not content.startswith(_PDF_MAGIC):
        raise HTTPException(400, "Le contenu ne correspond pas à un PDF valide")
    if ext == ".docx" and not content.startswith(_ZIP_MAGIC):
        raise HTTPException(400, "Le contenu ne correspond pas à un DOCX valide")
    if ext == ".doc" and not content.startswith(_DOC_MAGIC):
        raise HTTPException(400, "Le contenu ne correspond pas à un DOC valide")

    # Nom de stockage aléatoire : empêche la traversée de chemin et l'écrasement.
    stored_name = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    dest = os.path.join(UPLOAD_DIR, stored_name)
    with open(dest, "wb") as f:
        f.write(content)

    cv = models.CV(
        owner_id=current.id,
        original_filename=original,
        stored_path=stored_name,  # nom interne, jamais exposé publiquement
        content_type=file.content_type,
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
    cv = db.get(models.CV, cv_id)
    if not cv:
        raise HTTPException(404, "CV introuvable")
    # [CORRECTIF V2] Contrôle d'accès avant de renvoyer les métadonnées.
    if not _can_access_cv(cv, current, db):
        raise HTTPException(403, "Accès refusé à ce CV")
    return cv


@router.get("/{cv_id}/download")
def download_cv(cv_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = db.get(models.CV, cv_id)
    if not cv:
        raise HTTPException(404, "CV introuvable")
    # [CORRECTIF V2] Téléchargement servi par l'API, après contrôle d'accès
    # (plus de dossier /uploads public).
    if not _can_access_cv(cv, current, db):
        raise HTTPException(403, "Accès refusé à ce CV")
    path = os.path.join(UPLOAD_DIR, os.path.basename(cv.stored_path))
    if not os.path.exists(path):
        raise HTTPException(404, "Fichier manquant")
    return FileResponse(path, filename=cv.original_filename, media_type=cv.content_type or "application/octet-stream")


@router.delete("/{cv_id}")
def delete_cv(cv_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = db.get(models.CV, cv_id)
    if not cv or cv.owner_id != current.id:
        raise HTTPException(404, "CV introuvable")
    db.query(models.Application).filter(models.Application.cv_id == cv_id).update({"cv_id": None})
    db.delete(cv)
    db.commit()
    return {"detail": "CV supprimé"}
