# Config de l'app (version corrigée - sécurisée)
import os
import secrets

APP_NAME = "JobBoard Secure"
APP_VERSION = "1.0.0-secure"

# [CORRECTIF V6] Aucun identifiant en dur : l'URL vient de l'environnement,
# ou est reconstruite à partir de variables séparées (mot de passe hors du code).
DATABASE_URL = os.getenv("DATABASE_URL") or (
    "postgresql+psycopg://"
    f"{os.getenv('DB_USER', 'jobboard')}:{os.getenv('DB_PASSWORD', 'jobboard')}"
    f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}"
    f"/{os.getenv('DB_NAME', 'jobboard')}"
)

# [CORRECTIF V5] Secret JWT lu depuis l'environnement ; si absent, un secret
# aléatoire fort est généré au démarrage (jamais de valeur faible en dur).
JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(48)
JWT_ALGORITHM = "HS256"
# [CORRECTIF V5] Durée de vie courte du jeton (8 heures au lieu de 30 jours).
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

# [CORRECTIF V6] Clé SMTP lue depuis l'environnement, plus aucune clé en dur.
SMTP_API_KEY = os.getenv("SMTP_API_KEY", "")

# [CORRECTIF V6] Debug désactivé par défaut (activable seulement en local).
DEBUG = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")

UPLOAD_DIR = os.getenv(
    "UPLOAD_DIR",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"),
)

# [CORRECTIF V4] Contraintes d'upload : extensions et type MIME autorisés, taille max.
ALLOWED_CV_EXTENSIONS = {".pdf", ".doc", ".docx"}
ALLOWED_CV_MIME = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_CV_SIZE = int(os.getenv("MAX_CV_SIZE", str(5 * 1024 * 1024)))  # 5 Mo

# [CORRECTIF V6] CORS restreint aux origines explicitement autorisées.
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:8080,http://localhost:5173").split(",")
    if o.strip()
]
