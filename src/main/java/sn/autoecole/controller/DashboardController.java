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

    @GetMapping("/localites")
    public Map<String, Object> localites(@RequestParam(required = false) Integer annee) {
        return dashboardService.localites(annee);
    }
}
