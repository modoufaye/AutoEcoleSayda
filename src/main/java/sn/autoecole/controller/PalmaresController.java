package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import sn.autoecole.service.PalmaresService;

import java.util.Map;

/** Publication immédiate de l'annonce des champions de la semaine (administration). */
@RestController
@RequiredArgsConstructor
public class PalmaresController {

    private final PalmaresService service;

    /** Annonce des champions de la semaine passée (lundi → dimanche), sans attendre lundi. */
    @PostMapping("/api/admin/palmares/publier")
    public Map<String, Object> publierMaintenant() {
        return Map.of("seances", service.publierSemainePassee());
    }
}
