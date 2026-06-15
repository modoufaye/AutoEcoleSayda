package sn.autoecole.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.UserRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createIfAbsent("Administrateur",  "admin@autoecole.sn",              "Admin@2024",    RoleUser.SUPER_ADMIN);
        createIfAbsent("Mamadou Diallo", "moniteur@autoecole.sn",           "Moniteur@2024", RoleUser.MONITEUR);
        createIfAbsent("Fatou Ndiaye",   "fatou.ndiaye@autoecole.sn",       "Moniteur@2024", RoleUser.MONITEUR);
        createIfAbsent("Ibrahima Mbaye", "ibrahima.mbaye@autoecole.sn",     "Moniteur@2024", RoleUser.MONITEUR);
        createIfAbsent("Fatou Ndiaye",   "eleve@autoecole.sn",              "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Oumar Fall",     "oumar.fall@gmail.com",            "Eleve@2024",    RoleUser.ELEVE);
    }

    private void createIfAbsent(String nom, String email, String motDePasse, RoleUser role) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(User.builder()
                    .nom(nom)
                    .email(email)
                    .motDePasse(passwordEncoder.encode(motDePasse))
                    .role(role)
                    .build());
            log.info("Compte {} créé : {} / {}", role, email, motDePasse);
        }
    }
}
