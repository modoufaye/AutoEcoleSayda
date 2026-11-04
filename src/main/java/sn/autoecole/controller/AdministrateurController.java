package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
import java.util.Set;
import java.util.stream.Stream;

/**
 * Comptes administrateurs (rôles SUPER_ADMIN et ADMIN), gérés depuis Paramètres par un super admin.
 * Réservé au super admin par SecurityConfig : l'administrateur (ADMIN) ne crée pas d'administrateur
 * et n'agit pas sur un super admin. Le téléphone sert d'identifiant ; le mot de passe n'est renvoyé
 * qu'à sa création ou à son renouvellement. Garde-fous : on ne se désactive ni ne se supprime
 * soi-même, et il reste toujours au moins un super admin actif.
 */
@RestController
@RequestMapping("/api/admin/administrateurs")
@RequiredArgsConstructor
public class AdministrateurController {

    private static final String ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Set<RoleUser> ROLES = Set.of(RoleUser.SUPER_ADMIN, RoleUser.ADMIN);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Map<String, Object>> lister(Authentication auth) {
        return Stream.concat(userRepository.findAllByRole(RoleUser.SUPER_ADMIN).stream(), userRepository.findAllByRole(RoleUser.ADMIN).stream())
                .map(u -> Map.<String, Object>of("id", u.getId(), "nom", u.getNom(), "identifiant", u.getEmail(),
                        "role", u.getRole(), "actif", u.isActif(), "moi", estMoi(u, auth)))
                .toList();
    }

    /** Crée le compte et renvoie son mot de passe en clair, seul moment où il est connu.
        role : ADMIN (par défaut) ou SUPER_ADMIN. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> creer(@RequestBody Map<String, String> body) {
        RoleUser role = "SUPER_ADMIN".equals(body.get("role")) ? RoleUser.SUPER_ADMIN : RoleUser.ADMIN;
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
                .role(role).actif(true).build());
        return Map.of("id", user.getId(), "nom", nom, "identifiant", tel, "role", role, "motDePasse", motDePasse);
    }

    /** Nouveau mot de passe pour un autre admin (oublié, compte bloqué) ; le sien se change soi-même. */
    @PostMapping("/{id}/identifiants")
    public Map<String, Object> regenerer(@PathVariable Long id, Authentication auth) {
        User user = autreAdmin(id, auth, "Changez votre propre mot de passe avec « Changer le mot de passe »");
        String motDePasse = motDePasseAleatoire();
        user.setMotDePasse(passwordEncoder.encode(motDePasse));
        user.debloquer();
        userRepository.save(user);
        return Map.of("id", id, "nom", user.getNom(), "identifiant", user.getEmail(), "motDePasse", motDePasse);
    }

    /** Désactivé : ne peut plus se connecter ; réactivable. */
    @PatchMapping("/{id}/actif")
    public Map<String, Object> basculer(@PathVariable Long id, Authentication auth) {
        User user = autreAdmin(id, auth, "Vous ne pouvez pas désactiver votre propre compte");
        if (user.isActif()) garderUnSuperAdminActif(user);
        user.setActif(!user.isActif());
        userRepository.save(user);
        return Map.of("id", id, "actif", user.isActif());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id, Authentication auth) {
        User user = autreAdmin(id, auth, "Vous ne pouvez pas supprimer votre propre compte");
        if (user.isActif()) garderUnSuperAdminActif(user);
        userRepository.delete(user);
    }

    /** Un compte administrateur (super admin ou admin) autre que celui connecté ; jamais un autre rôle. */
    private User autreAdmin(Long id, Authentication auth, String messageSiMoi) {
        User user = userRepository.findById(id)
                .filter(u -> ROLES.contains(u.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte administrateur introuvable"));
        if (estMoi(user, auth)) throw new BusinessException(messageSiMoi);
        return user;
    }

    /** Appelé avant de retirer un compte actif : s'il est super admin, il doit en rester un autre. */
    private void garderUnSuperAdminActif(User retire) {
        if (retire.getRole() != RoleUser.SUPER_ADMIN) return;
        long actifs = userRepository.findAllByRole(RoleUser.SUPER_ADMIN).stream().filter(User::isActif).count();
        if (actifs <= 1) throw new BusinessException("Il doit rester au moins un super admin actif");
    }

    private static boolean estMoi(User u, Authentication auth) {
        return auth != null && u.getEmail().equalsIgnoreCase(auth.getName());
    }

    private static String motDePasseAleatoire() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        return sb.toString();
    }
}
