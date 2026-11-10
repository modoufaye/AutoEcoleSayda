package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.Bureau;
import sn.autoecole.service.BureauService;

import java.util.List;
import java.util.Map;

/**
 * Bureaux de l'auto-école. La liste est publique : la page d'accueil affiche adresses et numéros ;
 * les bureaux fermés y figurent (actif = false) pour nommer ceux des anciens élèves.
 * Création et modification : administration (Paramètres).
 */
@RestController
@RequiredArgsConstructor
public class BureauController {

    private final BureauService service;

    @GetMapping("/api/public/bureaux")
    public List<Bureau> lister() {
        return service.tous();
    }

    @PostMapping("/api/admin/bureaux")
    @ResponseStatus(HttpStatus.CREATED)
    public Bureau creer(@RequestBody Map<String, Object> body) {
        return service.creer(body);
    }

    @PutMapping("/api/admin/bureaux/{id}")
    public Bureau modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return service.modifier(id, body);
    }
}
