package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.service.AuthService;
import sn.autoecole.repository.UserRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/compte")
@RequiredArgsConstructor
public class CompteController {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/profil")
    public Map<String, Object> getProfil(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return Map.of("id", user.getId(), "nom", user.getNom(), "email", user.getEmail(), "role", user.getRole());
    }

    @PutMapping("/profil")
    public Map<String, Object> updateProfil(Authentication auth, @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("nom") && body.get("nom") != null && !body.get("nom").isBlank())
            user.setNom(body.get("nom").trim());
        userRepository.save(user);
        return Map.of("id", user.getId(), "nom", user.getNom(), "email", user.getEmail(), "role", user.getRole());
    }

    @PutMapping("/changer-mot-de-passe")
    public ResponseEntity<?> changerMotDePasse(Authentication auth, @RequestBody Map<String, String> body) {
        String ancien  = body.get("ancienMotDePasse");
        String nouveau = body.get("nouveauMotDePasse");

        var user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // Admin et secrétariat : 10 caractères au moins ; moniteurs : 6
        int min = user.getRole() == RoleUser.SUPER_ADMIN || user.getRole() == RoleUser.SECRETAIRE ? AuthService.MDP_MIN_GESTION : 6;
        if (ancien == null || nouveau == null || nouveau.length() < min)
            return ResponseEntity.badRequest().body(Map.of("erreur", "Le nouveau mot de passe doit faire au moins " + min + " caractères"));

        if (!passwordEncoder.matches(ancien, user.getMotDePasse()))
            return ResponseEntity.badRequest().body(Map.of("erreur", "Ancien mot de passe incorrect"));

        user.setMotDePasse(passwordEncoder.encode(nouveau));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
    }
}
