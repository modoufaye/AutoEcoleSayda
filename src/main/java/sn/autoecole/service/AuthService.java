package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
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
        return new AuthResponse(token, user.getNom(), user.getEmail(), user.getRole());
    }

    public AuthResponse login(AuthRequest request) {
        String email = normaliserEmail(request.getEmail());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getMotDePasse())
        );
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        String token = jwtUtil.generateToken(user);

        // Pour les élèves, utiliser le nom réel de l'entité Eleve
        String nomAffiche = user.getNom();
        if (user.getRole() == RoleUser.ELEVE) {
            nomAffiche = eleveRepository.findByEmailIgnoreCase(email)
                    .map(e -> e.getPrenom() + " " + e.getNom())
                    .orElse(user.getNom());
        }

        return new AuthResponse(token, nomAffiche, user.getEmail(), user.getRole());
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
