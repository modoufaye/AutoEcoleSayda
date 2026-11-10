# Serveur d'une auto-école : le .jar est construit et testé une seule fois par GitHub, puis envoyé
# tel quel à chaque auto-école (voir deploy/clients.json). Le serveur CapRover ne compile plus rien.
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY app.jar app.jar
# Répertoires persistés via volumes CapRover
RUN mkdir -p /app/data /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
