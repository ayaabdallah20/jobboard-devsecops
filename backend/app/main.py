# JobBoard Secure - API (version vulnérable, labo)
# Aya Abdallah & Ameni Azouz - TEK-UP 2026-2027
import logging
import os
import time
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
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
    description="Portail de recrutement — version vulnérable de laboratoire",
)

# [VULN V6] CORS permissif
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def access_log(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    # [VULN V6] on journalise toute la query-string
    log.info("%s %s?%s -> %s (%.0f ms) ip=%s", request.method, request.url.path, request.url.query,
             response.status_code, (time.time() - start) * 1000, request.client.host if request.client else "-")
    # [VULN V6] aucun en-tête de sécurité
    response.headers["X-Powered-By"] = "FastAPI/Python"  # divulgation de la stack
    return response


@app.exception_handler(Exception)
async def debug_errors(request: Request, exc: Exception):
    # [VULN V6] traces complètes renvoyées au client
    return JSONResponse(
        status_code=500,
        content={
            "error": type(exc).__name__,
            "detail": str(exc),
            "traceback": traceback.format_exc().splitlines() if config.DEBUG else None,
        },
    )


for r in (auth.router, users.router, jobs.router, applications.router, cvs.router, admin.router):
    app.include_router(r)

os.makedirs(config.UPLOAD_DIR, exist_ok=True)
# [VULN V4] CV servis publiquement, sans auth
app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR), name="uploads")


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
