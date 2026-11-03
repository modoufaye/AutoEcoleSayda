package sn.autoecole.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Version déployée (commit git), publique comme le reste de /api/auth/** : le déploiement
 * automatique (GitHub) l'interroge pour savoir quand le nouveau serveur a pris le relais.
 * Le fichier build-version.txt est ajouté par le workflow ; absent (poste local) : « dev ».
 */
@RestController
public class VersionController {

    private final String version = lire();

    @GetMapping("/api/auth/version")
    public Map<String, String> version() {
        return Map.of("version", version);
    }

    private static String lire() {
        try {
            return new String(new ClassPathResource("build-version.txt").getInputStream().readAllBytes(),
                    StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            return "dev";
        }
    }
}
