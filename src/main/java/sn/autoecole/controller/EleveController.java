package sn.autoecole.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.dto.EleveRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Examen;
import sn.autoecole.entity.Lecon;
import sn.autoecole.entity.Paiement;
import sn.autoecole.entity.User;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.enums.Site;
import sn.autoecole.enums.StatutEleve;
import sn.autoecole.repository.UserRepository;
import sn.autoecole.service.EleveService;
import sn.autoecole.service.ExamenService;
import sn.autoecole.service.LeconService;
import sn.autoecole.service.PaiementService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eleves")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EleveController {

    private final EleveService    eleveService;
    private final LeconService    leconService;
    private final ExamenService   examenService;
    private final PaiementService paiementService;
    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Eleve>> listerTous() {
        return ResponseEntity.ok(eleveService.listerTous());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Eleve> trouverParId(@PathVariable Long id) {
        return ResponseEntity.ok(eleveService.trouverParId(id));
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<Eleve>> rechercher(@RequestParam String terme) {
        return ResponseEntity.ok(eleveService.rechercher(terme));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Eleve>> listerParStatut(@PathVariable StatutEleve statut) {
        return ResponseEntity.ok(eleveService.listerParStatut(statut));
    }

    @GetMapping("/categorie/{categorie}")
    public ResponseEntity<List<Eleve>> listerParCategorie(@PathVariable CategoriePermis categorie) {
        return ResponseEntity.ok(eleveService.listerParCategorie(categorie));
    }

    @GetMapping("/site/{site}")
    public ResponseEntity<List<Eleve>> listerParSite(@PathVariable Site site) {
        return ResponseEntity.ok(eleveService.listerParSite(site));
    }

    @PostMapping
    public ResponseEntity<Eleve> creer(@Valid @RequestBody EleveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eleveService.creer(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Eleve> modifier(@PathVariable Long id, @Valid @RequestBody EleveRequest request) {
        return ResponseEntity.ok(eleveService.modifier(id, request));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Eleve> changerStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        StatutEleve statut = StatutEleve.valueOf(body.get("statut"));
        return ResponseEntity.ok(eleveService.changerStatut(id, statut));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        eleveService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/lecons")
    public ResponseEntity<List<Lecon>> listerLecons(@PathVariable Long id) {
        return ResponseEntity.ok(leconService.listerParEleve(id));
    }

    @GetMapping("/{id}/examens")
    public ResponseEntity<List<Examen>> listerExamens(@PathVariable Long id) {
        return ResponseEntity.ok(examenService.listerParEleve(id));
    }

    @GetMapping("/{id}/paiements")
    public ResponseEntity<List<Paiement>> listerPaiements(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.listerParEleve(id));
    }

    @GetMapping("/{id}/total-paye")
    public ResponseEntity<Map<String, BigDecimal>> totalPaye(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("totalPaye", paiementService.totalEncaisseParEleve(id)));
    }

    @PostMapping("/{id}/creer-compte")
    public ResponseEntity<?> creerCompte(@PathVariable Long id) {
        Eleve eleve = eleveService.trouverParId(id);
        if (eleve.getEmail() == null || eleve.getEmail().isBlank())
            return ResponseEntity.badRequest().body(Map.of("erreur", "L'élève n'a pas d'email renseigné"));
        if (userRepository.existsByEmail(eleve.getEmail()))
            return ResponseEntity.badRequest().body(Map.of("erreur", "Un compte existe déjà pour cet email"));
        String motDePasse = "Eleve@" + LocalDate.now().getYear();
        userRepository.save(User.builder()
                .nom(eleve.getNom() + " " + eleve.getPrenom())
                .email(eleve.getEmail())
                .motDePasse(passwordEncoder.encode(motDePasse))
                .role(RoleUser.ELEVE)
                .build());
        return ResponseEntity.ok(Map.of("email", eleve.getEmail(), "motDePasse", motDePasse));
    }

    @GetMapping("/{id}/compte")
    public ResponseEntity<?> statutCompte(@PathVariable Long id) {
        Eleve eleve = eleveService.trouverParId(id);
        boolean existe = eleve.getEmail() != null && userRepository.existsByEmail(eleve.getEmail());
        return ResponseEntity.ok(Map.of("compteActif", existe, "email", eleve.getEmail() != null ? eleve.getEmail() : ""));
    }

    @GetMapping("/comptes")
    public ResponseEntity<List<Map<String, Object>>> listerComptes() {
        return ResponseEntity.ok(
            userRepository.findAllByRole(RoleUser.ELEVE).stream()
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("nom", u.getNom());
                    m.put("email", u.getEmail());
                    m.put("motDePasse", "Eleve@" + java.time.LocalDate.now().getYear());
                    return m;
                })
                .toList()
        );
    }
}
