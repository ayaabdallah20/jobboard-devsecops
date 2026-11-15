# JobBoard Secure - API (version corrigée, sécurisée)
# Aya Abdallah & Ameni Azouz - TEK-UP 2026-2027
import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from . import config
from .database import engine
from .routers import admin, applications, auth, cvs, jobs, users
from .seed import seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("jobboard")

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description="Portail de recrutement — version sécurisée",
)

# [CORRECTIF V6] CORS restreint aux origines déclarées, méthodes/en-têtes limités.
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    # [CORRECTIF V6] Journaux sans query-string ni donnée sensible.
    log.info("%s %s -> %s (%.0f ms)", request.method, request.url.path,
             response.status_code, (time.time() - start) * 1000)
    # [CORRECTIF V6] En-têtes de sécurité (répond aussi aux alertes ZAP).
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    # [CORRECTIF V6] On ne divulgue plus la stack technique.
    response.headers["X-Powered-By"] = ""
    del response.headers["X-Powered-By"]
    return response


@app.exception_handler(Exception)
async def generic_errors(request: Request, exc: Exception):
    # [CORRECTIF V6] Erreur générique : aucune trace ni détail interne renvoyé.
    log.error("Erreur interne sur %s %s : %s", request.method, request.url.path, type(exc).__name__)
    return JSONResponse(status_code=500, content={"detail": "Erreur interne du serveur"})


for r in (auth.router, users.router, jobs.router, applications.router, cvs.router, admin.router):
    app.include_router(r)

os.makedirs(config.UPLOAD_DIR, exist_ok=True)
# [CORRECTIF V4] Plus de montage public des CV : ils ne sont servis que par
# /api/cvs/{id}/download, après authentification et contrôle d'accès.


@app.get("/api/health", tags=["Santé"])
def health():
    return {"status": "ok", "app": config.APP_NAME, "version": config.APP_VERSION}


@app.on_event("startup")
def startup():
    # Les tables ne sont PAS créées par l'ORM : le schéma est défini par l'équipe
    # dans database/schema.sql (à exécuter avant le premier lancement).
    ready = False
    for attempt in range(30):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1 FROM users LIMIT 1"))
            ready = True
            break
        except OperationalError:
            log.warning("Base de données indisponible, nouvelle tentative (%s/30)...", attempt + 1)
            time.sleep(2)
        except Exception:
            # La connexion fonctionne mais la table users est absente -> schéma non appliqué
            log.error("Table « users » introuvable. Exécutez d'abord : "
                      "psql -U jobboard -d jobboard -f database/schema.sql")
            return
    if ready:
        seed()  # insère les données fictives si les tables sont vides
