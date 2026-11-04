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

    /** Répartition des élèves par lieu d'inscription et par quartier ; annee absente : toutes. */
    @GetMapping("/localites")
    public Map<String, Object> localites(@RequestParam(required = false) Integer annee) {
        return dashboardService.localites(annee);
    }
}
