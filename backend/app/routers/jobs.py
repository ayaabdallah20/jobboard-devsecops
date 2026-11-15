from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..sanitize import clean_html
from ..schemas import JobIn, JobOut, StatusIn
from ..security import CurrentUser, require_roles

router = APIRouter(prefix="/api/jobs", tags=["Offres"])

CONTRACTS = ["CDI", "CDD", "Stage", "Alternance", "Freelance"]


def _with_count(db: Session, jobs: list[models.Job]) -> list[dict]:
    ids = [j.id for j in jobs]
    counts = dict(
        db.query(models.Application.job_id, func.count(models.Application.id))
        .filter(models.Application.job_id.in_(ids))
        .group_by(models.Application.job_id)
        .all()
    ) if ids else {}
    out = []
    for j in jobs:
        d = JobOut.model_validate(j).model_dump()
        d["applications_count"] = counts.get(j.id, 0)
        out.append(d)
    return out


@router.get("")
def list_jobs(db: Session = Depends(get_db)):
    jobs = (
        db.query(models.Job)
        .filter(models.Job.status == "published")
        .order_by(models.Job.created_at.desc())
        .all()
    )
    return _with_count(db, jobs)


@router.get("/search")
def search_jobs(q: str = "", location: str = "", contract: str = "", db: Session = Depends(get_db)):
    # [CORRECTIF V1] Requête paramétrée via l'ORM : les entrées utilisateur sont
    # transmises comme valeurs liées, jamais concaténées dans le SQL.
    # Un '%' ou une apostrophe n'est plus interprété comme du code.
    query = db.query(models.Job).filter(models.Job.status == "published")
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Job.title.ilike(like), models.Job.company.ilike(like)))
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    if contract:
        query = query.filter(models.Job.contract_type == contract)
    jobs = query.order_by(models.Job.created_at.desc()).all()
    results = _with_count(db, jobs)
    # [CORRECTIF V6] On n'expose plus la requête SQL interne.
    return {"count": len(results), "results": results}


@router.get("/meta/contracts")
def contracts():
    return CONTRACTS


@router.get("/mine")
def my_jobs(current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    jobs = (
        db.query(models.Job)
        .filter(models.Job.recruiter_id == current.id)
        .order_by(models.Job.created_at.desc())
        .all()
    )
    return _with_count(db, jobs)


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(models.Job, job_id)
    if not job:
        raise HTTPException(404, "Offre introuvable")
    d = _with_count(db, [job])[0]
    d["recruiter_name"] = job.recruiter.full_name if job.recruiter else None
    return d


@router.post("", status_code=201)
def create_job(data: JobIn, current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    # [CORRECTIF V3] description/requirements assainies (anti-XSS stocké)
    payload = data.model_dump()
    payload["description"] = clean_html(payload.get("description"))
    payload["requirements"] = clean_html(payload.get("requirements"))
    job = models.Job(**payload, recruiter_id=current.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return _with_count(db, [job])[0]


@router.put("/{job_id}")
def update_job(job_id: int, data: JobIn, current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    job = db.get(models.Job, job_id)
    if not job:
        raise HTTPException(404, "Offre introuvable")
    if job.recruiter_id != current.id and current.role != "admin":
        raise HTTPException(403, "Vous ne pouvez modifier que vos propres offres")
    payload = data.model_dump()
    # [CORRECTIF V3] on assainit le HTML à chaque mise à jour
    payload["description"] = clean_html(payload.get("description"))
    payload["requirements"] = clean_html(payload.get("requirements"))
    for k, v in payload.items():
        setattr(job, k, v)
    db.commit()
    db.refresh(job)
    return _with_count(db, [job])[0]


@router.patch("/{job_id}/status")
def set_job_status(job_id: int, data: StatusIn, current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    if data.status not in ("draft", "published", "closed"):
        raise HTTPException(400, "Statut invalide")
    job = db.get(models.Job, job_id)
    if not job:
        raise HTTPException(404, "Offre introuvable")
    if job.recruiter_id != current.id and current.role != "admin":
        raise HTTPException(403, "Vous ne pouvez modifier que vos propres offres")
    job.status = data.status
    db.commit()
    return {"id": job.id, "status": job.status}


@router.delete("/{job_id}")
def delete_job(job_id: int, current: CurrentUser = Depends(require_roles("recruteur", "admin")), db: Session = Depends(get_db)):
    job = db.get(models.Job, job_id)
    if not job:
        raise HTTPException(404, "Offre introuvable")
    if job.recruiter_id != current.id and current.role != "admin":
        raise HTTPException(403, "Vous ne pouvez supprimer que vos propres offres")
    db.query(models.Application).filter(models.Application.job_id == job_id).delete()
    db.delete(job)
    db.commit()
    return {"detail": "Offre supprimée"}
