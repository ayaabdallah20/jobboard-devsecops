# Frontend - build Vite puis nginx non-root (§4.1)

# Étape 1 : build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : service nginx (non-root, port 8080)
# L'image "unprivileged" écoute sur le port 8080 et tourne déjà sans droits root
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Configuration nginx (SPA + proxy /api et /uploads vers le backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers statiques construits
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

# (l'image de base définit déjà USER nginx et un ENTRYPOINT adapté)
