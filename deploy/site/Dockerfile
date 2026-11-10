# Site d'une auto-école, déjà construit par GitHub (dist/) : le serveur n'a plus qu'à le servir.
# Le workflow ajoute la ligne ENV SERVEUR=… propre à l'auto-école (voir deploy/clients.json).
FROM nginx:alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY dist /usr/share/nginx/html
ENV NGINX_ENVSUBST_FILTER=^SERVEUR$
EXPOSE 80
