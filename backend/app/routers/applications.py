from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import ApplicationIn, StatusIn
from ..security import CurrentUser, get_current_user, require_roles

router = APIRouter(prefix="/api/applications", tags=["Candidatures"])

STATUSES = ["envoyee", "en_revue", "entretien", "acceptee", "refusee"]


def serialize(a: models.Application, full: bool = False) -> dict:
    d = {
        "id": a.id,
        "job_id": a.job_id,
        "job_title": a.job.title if a.job else None,
        "company": a.job.company if a.job else None,
        "candidate_id": a.candidate_id,
        "candidate_name": a.candidate.full_name if a.candidate else None,
        "candidate_email": a.candidate.email if a.candidate else None,
        "candidate_headline": a.candidate.headline if a.candidate else None,
        "cv_id": a.cv_id,
        "cv_filename": a.cv.original_filename if a.cv else None,
        "cover_letter": a.cover_letter,
        "status": a.status,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    }
    if full and a.candidate:
        c = a.candidate
        d["candidate"] = {
            "id": c.id, "full_name": c.full_name, "email": c.email, "phone": c.phone,
            "address": c.address, "city": c.city, "birth_date": c.birth_date,
            "headline": c.headline, "bio": c.bio, "skills": c.skills,
        }
    return d


@router.post("", status_code=201)
def apply(data: ApplicationIn, current: CurrentUser = Depends(require_roles("candidat")), db: Session = Depends(get_db)):
    job = db.get(models.Job, data.job_id)
    if not job or job.status != "published":
        raise HTTPException(400, "Cette offre n'accepte pas de candidatures")
    exists = db.query(models.Application).filter_by(job_id=job.id, candidate_id=current.id).first()
    if exists:
        raise HTTPException(400, "Vous avez déjà postulé à cette offre")
    # [CORRECTIF V2] Le CV joint doit appartenir au candidat connecté.
    if data.cv_id is not None:
        cv = db.get(models.CV, data.cv_id)
        if not cv or cv.owner_id != current.id:
            raise HTTPException(403, "Ce CV ne vous appartient pas")
    app = models.Application(job_id=job.id, candidate_id=current.id, cv_id=data.cv_id, cover_letter=data.cover_letter)
    db.add(app)
    db.commit()
    db.refresh(app)
    return serialize(app)


@router.get("/mine")
def my_applications(current: CurrentUser = Depends(require_roles("candidat")), db: Session = Depends(get_db)):
    apps = (
        db.query(models.Application)
        .filter(models.Application.candidate_id == current.id)
        .order_by(models.Application.created_at.desc())
        .all()
    )
    return [serialize(a) for a in apps]


@router.get("/received")
def received(current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    q = db.query(models.Application).join(models.Job)
    if current.role != "admin":
        q = q.filter(models.Job.recruiter_id == current.id)
    return [serialize(a) for a in q.order_by(models.Application.created_at.desc()).all()]


def _owns_job(a: models.Application, current: CurrentUser) -> bool:
    return current.role == "admin" or (a.job and a.job.recruiter_id == current.id)


@router.get("/job/{job_id}")
def by_job(job_id: int, current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    job = db.get(models.Job, job_id)
    if not job:
        raise HTTPException(404, "Offre introuvable")
    # [CORRECTIF V2] Le recruteur ne voit que les candidatures de SES offres.
    if job.recruiter_id != current.id and current.role != "admin":
        raise HTTPException(403, "Accès refusé à cette offre")
    apps = db.query(models.Application).filter(models.Application.job_id == job_id).all()
    return [serialize(a, full=True) for a in apps]


@router.get("/{app_id}")
def get_application(app_id: int, current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.get(models.Application, app_id)
    if not a:
        raise HTTPException(404, "Candidature introuvable")
    # [CORRECTIF V2] Accès réservé au candidat auteur ou au recruteur de l'offre.
    if a.candidate_id != current.id and not _owns_job(a, current):
        raise HTTPException(403, "Accès refusé à cette candidature")
    return serialize(a, full=True)


@router.patch("/{app_id}/status")
def set_status(app_id: int, data: StatusIn, current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    # [CORRECTIF V2] Seul le recruteur propriétaire de l'offre (ou un admin)
    # peut changer le statut : un candidat ne peut plus s'auto-accepter.
    if data.status not in STATUSES:
        raise HTTPException(400, "Statut invalide")
    a = db.get(models.Application, app_id)
    if not a:
        raise HTTPException(404, "Candidature introuvable")
    if not _owns_job(a, current):
        raise HTTPException(403, "Accès refusé à cette candidature")
    a.status = data.status
    db.commit()
    db.refresh(a)
    return serialize(a)


@router.delete("/{app_id}")
def withdraw(app_id: int, current: CurrentUser = Depends(require_roles("candidat")), db: Session = Depends(get_db)):
    a = db.get(models.Application, app_id)
    if not a or a.candidate_id != current.id:
        raise HTTPException(404, "Candidature introuvable")
    db.delete(a)
    db.commit()
    return {"detail": "Candidature retirée"}
