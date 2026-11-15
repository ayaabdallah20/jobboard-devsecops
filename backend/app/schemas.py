from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class RegisterIn(BaseModel):
    email: str  # [VULN V5] format non validé
    password: str  # [VULN V5] aucune politique de mot de passe
    full_name: str
    role: str = "candidat"  # [VULN V5] rôle choisi par le client (y compris "admin")
    company: str | None = None


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    birth_date: date | None = None
    headline: str | None = None
    bio: str | None = None
    skills: str | None = None
    company: str | None = None
    created_at: datetime | None = None


class ProfileIn(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    birth_date: date | None = None
    headline: str | None = None
    bio: str | None = None  # [VULN V3] HTML accepté et stocké tel quel
    skills: str | None = None
    company: str | None = None


class JobIn(BaseModel):
    title: str
    company: str
    location: str
    contract_type: str = "CDI"
    salary: str | None = None
    remote: str = "Sur site"
    description: str  # [VULN V3] HTML accepté et stocké tel quel
    requirements: str | None = None
    status: str = "draft"


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recruiter_id: int
    title: str
    company: str
    location: str
    contract_type: str
    salary: str | None
    remote: str
    description: str
    requirements: str | None
    status: str
    created_at: datetime | None
    updated_at: datetime | None
    applications_count: int = 0


class StatusIn(BaseModel):
    status: str


class ApplicationIn(BaseModel):
    job_id: int
    cv_id: int | None = None
    cover_letter: str | None = None


class CVOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    original_filename: str
    stored_path: str
    content_type: str | None
    size: int
    uploaded_at: datetime | None


class AdminUserPatch(BaseModel):
    is_active: bool | None = None
    role: str | None = None
