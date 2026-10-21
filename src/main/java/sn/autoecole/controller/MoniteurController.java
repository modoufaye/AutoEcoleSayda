package sn.autoecole.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.dto.MoniteurRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Lecon;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.service.LeconService;
import sn.autoecole.service.MoniteurService;

import java.util.List;

@RestController
@RequestMapping("/api/moniteurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MoniteurController {

    private final MoniteurService moniteurService;
    private final LeconService leconService;
    private final EleveRepository eleveRepository;

    @GetMapping
    public ResponseEntity<List<Moniteur>> listerTous() {
        return ResponseEntity.ok(moniteurService.listerTous());
    }

    @GetMapping("/actifs")
    public ResponseEntity<List<Moniteur>> listerActifs() {
        return ResponseEntity.ok(moniteurService.listerActifs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Moniteur> trouverParId(@PathVariable Long id) {
        return ResponseEntity.ok(moniteurService.trouverParId(id));
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<Moniteur>> rechercher(@RequestParam String terme) {
        return ResponseEntity.ok(moniteurService.rechercher(terme));
    }

    @PostMapping
    public ResponseEntity<Moniteur> creer(@Valid @RequestBody MoniteurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(moniteurService.creer(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Moniteur> modifier(@PathVariable Long id, @Valid @RequestBody MoniteurRequest request) {
        return ResponseEntity.ok(moniteurService.modifier(id, request));
    }

    @PatchMapping("/{id}/toggle-actif")
    public ResponseEntity<Moniteur> toggleActif(@PathVariable Long id) {
        return ResponseEntity.ok(moniteurService.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        moniteurService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/lecons")
    public ResponseEntity<List<Lecon>> listerLecons(@PathVariable Long id) {
        return ResponseEntity.ok(leconService.listerParMoniteur(id));
    }

    @GetMapping("/{id}/eleves")
    public ResponseEntity<List<Eleve>> listerEleves(@PathVariable Long id) {
        return ResponseEntity.ok(eleveRepository.findByMoniteurIdAndArchiveFalse(id));
    }
}
