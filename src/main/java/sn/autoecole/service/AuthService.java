package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import sn.autoecole.dto.AuthRequest;
import sn.autoecole.dto.AuthResponse;
import sn.autoecole.dto.RegisterRequest;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.UserRepository;
import sn.autoecole.security.JwtUtil;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository    userRepository;
    private final EleveRepository   eleveRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        // Email canonique en base : la casse et les espaces parasites de saisie
        // ne doivent pas créer de comptes en double.
        String email = normaliserEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Un compte avec cet email existe déjà");
        }
        User user = User.builder()
                .nom(request.getNom())
                .email(email)
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .role(request.getRole())
                .build();
        userRepository.save(user);
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getNom(), user.getEmail(), user.getRole(), false);
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail();   // déjà normalisé par AuthRequest (email ou téléphone)
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getMotDePasse())
            );
        } catch (BadCredentialsException e) {
            throw enregistrerEchec(email);
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        if (user.getEchecsConnexion() != null && user.getEchecsConnexion() > 0) {
            user.setEchecsConnexion(0);
            userRepository.save(user);
        }
        String token = jwtUtil.generateToken(user);

        // Pour les élèves, utiliser le nom réel de l'entité Eleve
        String nomAffiche = user.getNom();
        if (user.getRole() == RoleUser.ELEVE) {
            nomAffiche = eleveRepository.findFirstByTelephone(email)
                    .map(e -> e.getPrenom() + " " + e.getNom())
                    .orElse(user.getNom());
        }

        // Admin et secrétariat : 10 caractères au moins ; un mot de passe plus court doit être changé tout de suite
        boolean aChanger = (user.getRole() == RoleUser.SUPER_ADMIN || user.getRole() == RoleUser.ADMIN || user.getRole() == RoleUser.SECRETAIRE)
                && request.getMotDePasse().length() < MDP_MIN_GESTION;
        return new AuthResponse(token, nomAffiche, user.getEmail(), user.getRole(), aChanger);
    }

    /** Longueur minimale du mot de passe d'un admin ou d'une secrétaire. */
    public static final int MDP_MIN_GESTION = 10;

    /**
     * Mot de passe faux : compte un essai de plus et bloque le compte au MAX_ECHECS-ième.
     * Hors transaction : le compteur est enregistré même si la connexion échoue.
     * Identifiant inconnu : même message qu'un mauvais mot de passe (pas d'énumération).
     */
    private AuthenticationException enregistrerEchec(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) return new BadCredentialsException("Email ou mot de passe incorrect");
        int echecs = (user.getEchecsConnexion() == null ? 0 : user.getEchecsConnexion()) + 1;
        user.setEchecsConnexion(echecs);
        if (echecs >= User.MAX_ECHECS) user.setBloque(true);
        userRepository.save(user);
        if (user.isBloque()) return new LockedException("Compte bloqué");
        int reste = User.MAX_ECHECS - echecs;
        return new BadCredentialsException(reste <= 2
                ? "Email ou mot de passe incorrect. Attention : encore " + reste + " essai" + (reste > 1 ? "s" : "") + " avant le blocage du compte."
                : "Email ou mot de passe incorrect");
    }

    /**
     * Retire les espaces parasites et ramène l'email en minuscules.
     * Les claviers mobiles (majuscule automatique, suggestions, remplissage
     * auto) produisent très facilement « Admin@… » ou un espace final, qui
     * faisaient échouer la connexion.
     */
    private String normaliserEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
