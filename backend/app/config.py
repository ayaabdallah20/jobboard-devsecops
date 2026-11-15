# Config de l'app (version vulnérable - labo)
import os

APP_NAME = "JobBoard Secure"
APP_VERSION = "1.0.0-vulnerable"

# [VULN V6] identifiants en dur (fictifs)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://jobboard:jobboard123@localhost:5432/jobboard",
)

# [VULN V5] secret JWT trop faible + validité de 30 jours
JWT_SECRET = os.getenv("JWT_SECRET", "secret123")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30

SMTP_API_KEY = "FAKE-smtp-key-jobboard-lab-0000000000"  # [VULN V6] clé de test oubliée

DEBUG = True  # [VULN V6] debug toujours actif

UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))

CORS_ORIGINS = ["*"]  # [VULN V6] CORS ouvert
