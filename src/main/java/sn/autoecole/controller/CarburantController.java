package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.service.CarburantService;

import java.util.Map;

/** Carburant des moniteurs de conduite : dotations, pleins déclarés et leur validation. */
@RestController
@RequestMapping("/api/carburant")
@RequiredArgsConstructor
public class CarburantController {

    private final CarburantService service;

    @GetMapping("/acces")
    public Map<String, Boolean> acces(Authentication auth) {
        return Map.of("acces", service.acces(auth));
    }

    @GetMapping
    public Map<String, Object> etat(Authentication auth) {
        return service.etat(auth);
    }

    @PostMapping("/dotations")
    public Map<String, Object> donner(@RequestBody Map<String, Object> corps, Authentication auth) {
        service.donner(corps, auth);
        return service.etat(auth);
    }

    @DeleteMapping("/dotations/{id}")
    public Map<String, Object> supprimerDotation(@PathVariable Long id, Authentication auth) {
        service.supprimerDotation(id, auth);
        return service.etat(auth);
    }

    @PostMapping("/pleins")
    public Map<String, Object> declarer(@RequestBody Map<String, Object> corps, Authentication auth) {
        service.declarer(corps, auth);
        return service.etat(auth);
    }

    @PutMapping("/pleins/{id}")
    public Map<String, Object> modifier(@PathVariable Long id, @RequestBody Map<String, Object> corps, Authentication auth) {
        service.modifier(id, corps, auth);
        return service.etat(auth);
    }

    @DeleteMapping("/pleins/{id}")
    public Map<String, Object> supprimer(@PathVariable Long id, Authentication auth) {
        service.supprimer(id, auth);
        return service.etat(auth);
    }

    @PatchMapping("/pleins/{id}/valider")
    public Map<String, Object> valider(@PathVariable Long id, Authentication auth) {
        service.traiter(id, true, null, auth);
        return service.etat(auth);
    }

    @PatchMapping("/pleins/{id}/refuser")
    public Map<String, Object> refuser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> corps, Authentication auth) {
        service.traiter(id, false, corps == null ? null : corps.get("motif"), auth);
        return service.etat(auth);
    }
}
