package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/moniteur")
@RequiredArgsConstructor
public class MoniteurPortailController {

    private final MoniteurRepository moniteurRepository;
    private final EleveRepository    eleveRepository;

    private Moniteur moniteurConnecte(Authentication auth) {
        return moniteurRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Aucun profil moniteur associé à ce compte"));
    }

    @GetMapping("/profil")
    public Moniteur getProfil(Authentication auth) {
        return moniteurConnecte(auth);
    }

    @PutMapping("/profil")
    public Moniteur updateProfil(Authentication auth, @RequestBody Map<String, String> body) {
        Moniteur moniteur = moniteurConnecte(auth);
        if (body.containsKey("nom")       && body.get("nom")       != null) moniteur.setNom(body.get("nom").trim());
        if (body.containsKey("prenom")    && body.get("prenom")    != null) moniteur.setPrenom(body.get("prenom").trim());
        if (body.containsKey("telephone") && body.get("telephone") != null) moniteur.setTelephone(body.get("telephone").trim());
        if (body.containsKey("email"))      moniteur.setEmail(body.get("email"));
        if (body.containsKey("numeroCni"))  moniteur.setNumeroCni(body.get("numeroCni"));
        return moniteurRepository.save(moniteur);
    }

    @GetMapping("/mes-eleves")
    public List<Eleve> getMesEleves(Authentication auth) {
        return eleveRepository.findByMoniteurIdAndArchiveFalse(moniteurConnecte(auth).getId());
    }
}
