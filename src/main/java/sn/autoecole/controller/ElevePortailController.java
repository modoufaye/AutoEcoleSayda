package sn.autoecole.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.dto.DeclarationPaiementRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Examen;
import sn.autoecole.entity.Lecon;
import sn.autoecole.entity.Paiement;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.PaiementRepository;
import sn.autoecole.repository.UserRepository;
import sn.autoecole.service.ExamenService;
import sn.autoecole.service.LeconService;
import sn.autoecole.service.PaiementService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eleve")
@RequiredArgsConstructor
public class ElevePortailController {

    private final EleveRepository    eleveRepository;
    private final UserRepository     userRepository;
    private final PaiementRepository paiementRepository;
    private final PasswordEncoder    passwordEncoder;
    private final ExamenService      examenService;
    private final LeconService       leconService;
    private final PaiementService    paiementService;
    private final sn.autoecole.service.CreneauxConduiteService creneauxService;

    private Eleve eleveConnecte(Authentication auth) {
        return eleveRepository.findFirstByTelephone(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Aucun profil élève associé à ce compte. Contactez l'administration."));
    }

    @GetMapping("/profil")
    public Eleve getProfil(Authentication auth) {
        return eleveConnecte(auth);
    }

    @PutMapping("/profil")
    public Eleve updateProfil(Authentication auth, @RequestBody Map<String, String> body) {
        Eleve eleve = eleveConnecte(auth);
        if (body.containsKey("nom")       && body.get("nom")       != null) eleve.setNom(body.get("nom").trim());
        if (body.containsKey("prenom")    && body.get("prenom")    != null) eleve.setPrenom(body.get("prenom").trim());
        // Pas de téléphone : c'est l'identifiant de connexion, changé seulement par l'auto-école.
        if (body.containsKey("adresse"))    eleve.setAdresse(body.get("adresse"));
        if (body.containsKey("numeroCni"))  eleve.setNumeroCni(body.get("numeroCni"));
        return eleveRepository.save(eleve);
    }

    @GetMapping("/mes-examens")
    public List<Examen> getMesExamens(Authentication auth) {
        return examenService.listerParEleve(eleveConnecte(auth).getId());
    }

    @GetMapping("/mes-lecons")
    public List<Lecon> getMesLecons(Authentication auth) {
        return leconService.listerParEleve(eleveConnecte(auth).getId());
    }

    /* Créneaux de conduite (CreneauxConduiteService) : planning de la semaine, réservation, annulation */
    @GetMapping("/creneaux")
    public Map<String, Object> creneaux(Authentication auth,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate semaine) {
        return creneauxService.planning(eleveConnecte(auth), semaine);
    }

    @PostMapping("/creneaux")
    @ResponseStatus(HttpStatus.CREATED)
    public Lecon reserverCreneau(Authentication auth, @RequestBody Map<String, String> body) {
        java.time.LocalDate date; java.time.LocalTime heure;
        try {
            date = java.time.LocalDate.parse(body.get("date"));
            heure = java.time.LocalTime.parse(body.get("heure"));
        } catch (Exception ex) {
            throw new sn.autoecole.exception.BusinessException("Choisissez un jour et une heure");
        }
        return creneauxService.reserver(eleveConnecte(auth), date, heure);
    }

    @DeleteMapping("/creneaux/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void annulerCreneau(Authentication auth, @PathVariable Long id) {
        creneauxService.annuler(eleveConnecte(auth), id);
    }

    @GetMapping("/mes-paiements")
    public List<Paiement> getMesPaiements(Authentication auth) {
        return paiementRepository.findByEleveId(eleveConnecte(auth).getId());
    }

    /** L'élève a payé via le lien Wave / Orange Money : le paiement est créé EN_ATTENTE. */
    @PostMapping("/paiements/declarer")
    @ResponseStatus(HttpStatus.CREATED)
    public Paiement declarerPaiement(Authentication auth, @Valid @RequestBody DeclarationPaiementRequest request) {
        return paiementService.declarerPaiementMobile(eleveConnecte(auth), request);
    }

    @PutMapping("/changer-mot-de-passe")
    public ResponseEntity<?> changerMotDePasse(Authentication auth, @RequestBody Map<String, String> body) {
        String ancien  = body.get("ancienMotDePasse");
        String nouveau = body.get("nouveauMotDePasse");
        if (ancien == null || nouveau == null || nouveau.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("erreur", "Données invalides (minimum 6 caractères)"));

        var user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(ancien, user.getMotDePasse()))
            return ResponseEntity.badRequest().body(Map.of("erreur", "Ancien mot de passe incorrect"));

        user.setMotDePasse(passwordEncoder.encode(nouveau));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
    }
}
