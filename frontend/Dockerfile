# ─── Build (Vite) ───────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Serve (nginx) ──────────────────────────────────────
FROM nginx:alpine
# nginx.conf est un modèle : ${SERVEUR} (serveur de l'auto-école) est remplacé au démarrage.
# Par défaut celui de l'installation d'origine ; une autre auto-école le fixe dans CapRover.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV SERVEUR=srv-captain--sayda-backend:8080 NGINX_ENVSUBST_FILTER=^SERVEUR$
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
