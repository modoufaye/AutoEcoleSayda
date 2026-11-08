package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.dto.SeanceRequest;
import sn.autoecole.dto.SeanceResponse;
import sn.autoecole.entity.Eleve;
import sn.autoecole.service.SeanceService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/moniteur/seances")
@RequiredArgsConstructor
public class SeanceMoniteurController {

    private final SeanceService seanceService;

    @GetMapping
    public List<SeanceResponse> list(@AuthenticationPrincipal UserDetails user,
                                     @RequestParam(required = false, defaultValue = "false") boolean all) {
        if (all) return seanceService.findAll();
        return seanceService.findByMoniteur(user.getUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SeanceResponse create(@RequestBody SeanceRequest req, @AuthenticationPrincipal UserDetails user) {
        return seanceService.create(req, user.getUsername());
    }

    @PutMapping("/{id}")
    public SeanceResponse update(@PathVariable Long id, @RequestBody SeanceRequest req,
                                 @AuthenticationPrincipal UserDetails user) {
        return seanceService.update(id, req, user.getUsername(), administration(user));
    }

    /** Séance publiée par l'administration : le moniteur coche ou décoche ses élèves. Corps : { eleveIds }. */
    @PatchMapping("/{id}/eleves")
    public SeanceResponse mesEleves(@PathVariable Long id, @RequestBody Map<String, List<Long>> body, @AuthenticationPrincipal UserDetails user) {
        return seanceService.ajouterMesEleves(id, body.get("eleveIds"), user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        seanceService.delete(id, user.getUsername(), administration(user));
    }

    /** Super admin, administrateurs et secrétariat : voient toutes les séances, leurs élèves et résultats. */
    private static boolean gestion(UserDetails user) {
        return administration(user) || user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SECRETAIRE"));
    }

    /** Super admin et administrateurs : modifient et suppriment toutes les séances (le secrétariat
        les consulte seulement, voir SecurityConfig). */
    private static boolean administration(UserDetails user) {
        return user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
    }

    /** Résultats du quiz de la séance, élève par élève. */
    @GetMapping("/{id}/resultats")
    public List<Map<String, Object>> resultats(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return seanceService.resultats(id, user.getUsername(), gestion(user));
    }

    /** Élèves : tous si admin, sinon ceux du moniteur connecté */
    @GetMapping("/eleves")
    public List<Map<String, Object>> getEleves(@AuthenticationPrincipal UserDetails user) {
        List<Eleve> eleves = gestion(user)
                ? seanceService.findAllEleves()
                : seanceService.findElevesByMoniteur(user.getUsername());
        // Les élèves en perfectionnement ne verront que les parties de conduite (SeanceService)
        return eleves.stream()
                .map(e -> Map.<String, Object>of(
                        "perfectionnement", e.estPerfectionnement(),
                        "id",    e.getId(),
                        "nom",   e.getPrenom() + " " + e.getNom(),
                        "email", e.getEmail() != null ? e.getEmail() : "",
                        // Le téléphone sert d'identifiant depuis que l'e-mail a quitté les fiches
                        "telephone", e.getTelephone() != null ? e.getTelephone() : ""
                ))
                .toList();
    }
}
