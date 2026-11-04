package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Comptes bloqués après 5 mots de passe faux (AuthService), à débloquer sur demande.
 * Admin : tous les comptes. Secrétariat : élèves et moniteurs seulement (jamais un admin
 * ni une autre secrétaire). Accès réservé à ces deux rôles par SecurityConfig.
 */
@RestController
@RequestMapping("/api/comptes-bloques")
@RequiredArgsConstructor
public class ComptesBloquesController {

    private static final Set<RoleUser> POUR_SECRETARIAT = Set.of(RoleUser.ELEVE, RoleUser.MONITEUR);

    private final UserRepository userRepository;

    @GetMapping
    public List<Map<String, Object>> lister(Authentication auth) {
        return userRepository.findAllByBloqueTrue().stream()
                .filter(u -> peutDebloquer(auth, u))
                .map(u -> Map.<String, Object>of("id", u.getId(), "nom", u.getNom(), "identifiant", u.getEmail(), "role", u.getRole()))
                .toList();
    }

    @PostMapping("/{id}/debloquer")
    public Map<String, Object> debloquer(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findById(id)
                .filter(u -> peutDebloquer(auth, u))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));
        user.debloquer();
        userRepository.save(user);
        return Map.of("id", id, "bloque", false);
    }

    private static boolean peutDebloquer(Authentication auth, User u) {
        boolean admin = auth.getAuthorities().stream().anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
        return admin || POUR_SECRETARIAT.contains(u.getRole());
    }
}
