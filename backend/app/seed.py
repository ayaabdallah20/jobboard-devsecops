# Données de démo (fictives) : 4 comptes, 2 offres, 2 CV, 2 candidatures
import logging
import os
from datetime import date

from . import models
from .config import UPLOAD_DIR
from .database import SessionLocal
from .security import hash_password

log = logging.getLogger("jobboard.seed")


def _pdf(lines: list[str]) -> bytes:
    """Génère un petit PDF d'une page (CV fictif) sans dépendance externe."""
    def esc(s: str) -> str:
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    text = ["BT", "/F1 20 Tf", "60 780 Td", f"({esc(lines[0])}) Tj", "/F1 11 Tf"]
    for line in lines[1:]:
        text += ["0 -22 Td", f"({esc(line)}) Tj"]
    text.append("ET")
    stream = "\n".join(text).encode("latin-1", "replace")
    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = b"%PDF-1.4\n"
    offsets = []
    for i, o in enumerate(objs, 1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + o + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref)
    return out


# (email, mot de passe, nom, rôle, extras) — index utilisé par JOBS / APPS ci-dessous
USERS = [
    # 0 — Administrateur (gère les comptes, les rôles et la plateforme)
    ("admin@jobboard.local", "admin123", "Administrateur JobBoard", "admin", {}),

    # 1 — Recruteur (publie les offres de son entreprise)
    ("recruteur@techvision.tn", "recruteur123", "Sami Ben Salah", "recruteur",
     {"company": "TechVision", "phone": "+216 71 000 101", "city": "Tunis", "headline": "Talent Acquisition Manager"}),

    # 2-3 — Candidates (ingénieures cybersécurité, Tunisie)
    ("aya.abdallah@gmail.com", "aya2026", "Aya Abdallah", "candidat",
     {"phone": "+216 50 100 001", "address": "14 rue des Jasmins, La Marsa", "city": "Tunis", "birth_date": date(2001, 4, 12),
      "headline": "Ingénieure en cybersécurité", "skills": "DevSecOps, Pentest, OWASP Top 10, Docker, Kubernetes",
      "bio": "<p>Ingénieure en <b>cybersécurité</b>, orientée <b>DevSecOps</b> : intégration de contrôles de "
             "sécurité dans les pipelines CI/CD (SAST, scan d'images, DAST) et test d'intrusion.</p>"}),
    ("ameni.azouz@gmail.com", "ameni2026", "Ameni Azouz", "candidat",
     {"phone": "+216 50 100 002", "address": "3 avenue Habib Bourguiba, Ariana", "city": "Ariana", "birth_date": date(2001, 9, 27),
      "headline": "Ingénieure en cybersécurité", "skills": "SOC, SIEM, Threat Intelligence, Réponse à incident",
      "bio": "<p>Ingénieure en <b>cybersécurité</b> défensive (<i>Blue Team</i>) : supervision SOC, détection, "
             "réponse à incident et renseignement sur les menaces.</p>"}),
]

# (index recruteur/admin, titre, entreprise, contrat, lieu, salaire, mode, statut, description, prérequis)
JOBS = [
    (1, "Ingénieur DevSecOps", "TechVision", "CDI", "Tunis", "3 500 – 4 500 TND", "Hybride", "published",
     "<p>Intégrez la sécurité dans nos chaînes <b>CI/CD</b> : SAST, analyse de dépendances, scan d'images, DAST.</p>"
     "<ul><li>Jenkins, GitLab CI</li><li>Semgrep, Trivy, Gitleaks, OWASP ZAP</li><li>Docker, Kubernetes</li></ul>",
     "Expérience Docker/Kubernetes, connaissance de l'OWASP Top 10"),
    (1, "Analyste SOC N2", "TechVision", "CDI", "Tunis", "3 000 – 3 900 TND", "Sur site", "published",
     "<p>Investigation approfondie des incidents de sécurité au sein de notre <b>SOC</b>.</p>"
     "<ul><li>Analyse d'alertes complexes</li><li>Corrélation SIEM</li><li>MITRE ATT&CK</li></ul>",
     "2 ans en SOC, maîtrise d'un SIEM"),
]

# (index candidat, index offre, statut, lettre)
APPS = [
    (2, 0, "en_revue", "Ingénieure cybersécurité orientée DevSecOps, votre offre correspond à mon profil."),
    (3, 1, "envoyee", "Analyste défensive, je suis à l'aise avec le SIEM et MITRE ATT&CK."),
]


def seed():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return
        log.info("Initialisation du jeu de données fictif (minimal)…")
        users = []
        for email, pwd, name, role, extra in USERS:
            u = models.User(email=email, password_hash=hash_password(pwd), full_name=name, role=role, **extra)
            db.add(u)
            users.append(u)
        db.flush()

        jobs = []
        for ridx, title, company, contract, loc, salary, remote, status, desc, req in JOBS:
            j = models.Job(recruiter_id=users[ridx].id, title=title, company=company, location=loc,
                           contract_type=contract, salary=salary, remote=remote, status=status,
                           description=desc, requirements=req)
            db.add(j)
            jobs.append(j)
        db.flush()

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        cvs = {}
        for u in users[2:]:  # candidates
            fname = f"CV_{u.full_name.replace(' ', '_')}.pdf"
            content = _pdf([
                u.full_name, u.headline or "", f"Email : {u.email}", f"Telephone : {u.phone}",
                f"Ville : {u.city}", f"Competences : {u.skills}",
                "", "DOCUMENT FICTIF - Projet DevSecOps TEK-UP (laboratoire)",
            ])
            with open(os.path.join(UPLOAD_DIR, fname), "wb") as f:
                f.write(content)
            cv = models.CV(owner_id=u.id, original_filename=fname, stored_path=fname,
                           content_type="application/pdf", size=len(content))
            db.add(cv)
            cvs[u.id] = cv
        db.flush()

        for cidx, jidx, status, letter in APPS:
            cand = users[cidx]
            db.add(models.Application(job_id=jobs[jidx].id, candidate_id=cand.id, cv_id=cvs[cand.id].id,
                                      cover_letter=letter, status=status))
        db.commit()
        log.info("Jeu de données fictif créé : %d utilisateurs, %d offres, %d candidatures.",
                 len(users), len(jobs), len(APPS))
    finally:
        db.close()
