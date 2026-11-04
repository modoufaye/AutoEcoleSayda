package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.UserRepository;
import sn.autoecole.util.Telephones;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;

/**
 * Comptes du secrétariat (rôle SECRETAIRE), gérés par l'admin depuis Paramètres.
 * Sous /api/admin/** : réservé à l'admin par SecurityConfig. Le téléphone sert d'identifiant
 * de connexion, comme pour les moniteurs ; le mot de passe n'est renvoyé qu'à sa création.
 */
@RestController
@RequestMapping("/api/admin/secretaires")
@RequiredArgsConstructor
public class SecretaireController {

    private static final String ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Map<String, Object>> lister() {
        return userRepository.findAllByRole(RoleUser.SECRETAIRE).stream()
                .map(u -> Map.<String, Object>of("id", u.getId(), "nom", u.getNom(), "identifiant", u.getEmail(), "actif", u.isActif()))
                .toList();
    }

    /** Crée le compte et renvoie son mot de passe en clair, seul moment où il est connu. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> creer(@RequestBody Map<String, String> body) {
        String nom = body.get("nom") != null ? body.get("nom").trim() : "";
        String tel = Telephones.normaliser(body.get("telephone"));
        if (nom.isEmpty()) throw new BusinessException("Le nom est obligatoire");
        if (tel == null) throw new BusinessException("Le téléphone est obligatoire : il sert d'identifiant de connexion");
        userRepository.findByEmailIgnoreCase(tel).ifPresent(u -> {
            throw new BusinessException("Ce numéro est déjà l'identifiant d'un compte " + u.getRole());
        });
        String motDePasse = motDePasseAleatoire();
        User user = userRepository.save(User.builder()
                .nom(nom).email(tel).motDePasse(passwordEncoder.encode(motDePasse))
                .role(RoleUser.SECRETAIRE).actif(true).build());
        return Map.of("id", user.getId(), "nom", nom, "identifiant", tel, "motDePasse", motDePasse);
    }

    /** Nouveau mot de passe (oublié ou à renvoyer). */
    @PostMapping("/{id}/identifiants")
    public Map<String, Object> regenerer(@PathVariable Long id) {
        User user = secretaire(id);
        String motDePasse = motDePasseAleatoire();
        user.setMotDePasse(passwordEncoder.encode(motDePasse));
        user.debloquer();
        userRepository.save(user);
        return Map.of("id", id, "nom", user.getNom(), "identifiant", user.getEmail(), "motDePasse", motDePasse);
    }

    /** Désactivé : ne peut plus se connecter ; réactivable. */
    @PatchMapping("/{id}/actif")
    public Map<String, Object> basculer(@PathVariable Long id) {
        User user = secretaire(id);
        user.setActif(!user.isActif());
        userRepository.save(user);
        return Map.of("id", id, "actif", user.isActif());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        userRepository.delete(secretaire(id));
    }

    /** Garde-fou : ces routes ne touchent jamais un compte admin, moniteur ou élève. */
    private User secretaire(Long id) {
        return userRepository.findById(id)
                .filter(u -> u.getRole() == RoleUser.SECRETAIRE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte secrétaire introuvable"));
    }

    private static String motDePasseAleatoire() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        return sb.toString();
    }
}
