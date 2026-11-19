package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.dto.DashboardStats;
import sn.autoecole.service.DashboardService;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;
    private final sn.autoecole.repository.MoniteurRepository moniteurRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    /** Nouveaux élèves par mois (permis / perfectionnement) ; annee absente : l'année en cours. */
    @GetMapping("/inscriptions")
    public Map<String, Object> inscriptions(@RequestParam(required = false) Integer annee) {
        return dashboardService.inscriptionsParMois(annee != null ? annee : java.time.LocalDate.now(sn.autoecole.service.PalmaresService.DAKAR).getYear());
    }

    /** Répartition des élèves par lieu d'inscription et par quartier ; annee absente : toutes. */
    /** Réussite aux examens : une année (détail par mois) ou toutes (annee absente, détail par année). */
    @GetMapping("/reussite")
    public Map<String, Object> reussite(@RequestParam(required = false) Integer annee) {
        return dashboardService.reussite(annee);
    }

    /** Encaissements par mois (ou par année) et reliquats des élèves à relancer. */
    @GetMapping("/finances")
    public Map<String, Object> finances(@RequestParam(required = false) Integer annee) {
        return dashboardService.finances(annee);
    }

    /** Parcours des élèves du permis : combien atteignent chaque étape, de l'inscription au permis. */
    @GetMapping("/parcours")
    public Map<String, Object> parcours(@RequestParam(required = false) Integer annee) {
        return dashboardService.parcours(annee);
    }

    /** Suivi pédagogique des élèves en préparation du code : assimilation et élèves à accompagner. */
    @GetMapping("/pedagogie")
    public Map<String, Object> pedagogie() {
        return dashboardService.pedagogie();
    }

    /** Préparation à l'examen du code : Prêt / Presque / Pas encore, par élève (paiement, dossier, séances). */
    @GetMapping("/preparation-code")
    public Map<String, Object> preparationCode() {
        return dashboardService.preparationCode();
    }

    /** Questions de code les plus ratées et séances les plus difficiles (quiz de séance). Gestion, et
        moniteurs qui font du code (pas ceux de la conduite seule). */
    @GetMapping("/questions-ratees")
    public Map<String, Object> questionsRatees(org.springframework.security.core.Authentication auth) {
        boolean moniteur = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MONITEUR"));
        if (moniteur && moniteurRepository.findFirstByTelephone(auth.getName()).map(m -> "CONDUITE".equals(m.getEnseignement())).orElse(true))
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Réservé aux moniteurs de code");
        return dashboardService.questionsRatees();
    }

    @GetMapping("/localites")
    public Map<String, Object> localites(@RequestParam(required = false) Integer annee) {
        return dashboardService.localites(annee);
    }
}
