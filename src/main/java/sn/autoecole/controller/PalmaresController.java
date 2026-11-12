package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import sn.autoecole.service.PalmaresService;

import java.util.List;
import java.util.Map;

/** Tableau d'honneur (élève) et publication immédiate de l'annonce des champions (administration). */
@RestController
@RequiredArgsConstructor
public class PalmaresController {

    private final PalmaresService service;

    @GetMapping("/api/eleve/palmares")
    public List<Map<String, Object>> monTableau(Authentication auth) {
        return service.pourEleve(auth.getName());
    }

    /** Annonce des champions de la semaine passée (lundi → dimanche), sans attendre lundi. */
    @PostMapping("/api/admin/palmares/publier")
    public Map<String, Object> publierMaintenant() {
        return Map.of("seances", service.publierSemainePassee());
    }
}
