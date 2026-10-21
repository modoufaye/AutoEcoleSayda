package sn.autoecole.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.dto.PaiementRequest;
import sn.autoecole.entity.Paiement;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.service.PaiementService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaiementController {

    private final PaiementService paiementService;

    @GetMapping
    public ResponseEntity<List<Paiement>> listerTous() {
        return ResponseEntity.ok(paiementService.listerTous());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Paiement> trouverParId(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.trouverParId(id));
    }

    @GetMapping("/periode")
    public ResponseEntity<List<Paiement>> listerParPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(paiementService.listerParPeriode(debut, fin));
    }

    @GetMapping("/total-encaisse")
    public ResponseEntity<Map<String, BigDecimal>> totalEncaisse() {
        return ResponseEntity.ok(Map.of("totalEncaisse", paiementService.totalEncaisse()));
    }

    @PostMapping
    public ResponseEntity<Paiement> creer(@Valid @RequestBody PaiementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paiementService.creer(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paiement> modifier(@PathVariable Long id, @Valid @RequestBody PaiementRequest request) {
        return ResponseEntity.ok(paiementService.modifier(id, request));
    }

    /** Validation (PAYE) ou refus (ANNULE) d'un paiement déclaré par un élève. */
    @PatchMapping("/{id}/statut")
    public ResponseEntity<Paiement> changerStatut(@PathVariable Long id, @RequestBody Map<String, StatutPaiement> body) {
        return ResponseEntity.ok(paiementService.changerStatut(id, body.get("statut")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        paiementService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
