package sn.autoecole.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    /** Comptes de démo : profil dev uniquement (application-dev.properties). */
    @Value("${demo.comptes:false}")
    private boolean demoComptes;

    @Override
    public void run(String... args) {
        // Compte admin initial : seulement s'il n'existe aucun administrateur, pour pouvoir se
        // connecter à une installation neuve. Changer son mot de passe dès le premier déploiement
        // (il figure dans le README). Tester l'email ne suffirait pas : un admin qui a changé
        // d'email verrait réapparaître un second compte admin au mot de passe public.
        if (userRepository.findAllByRole(RoleUser.SUPER_ADMIN).isEmpty()) {
            createIfAbsent("Administrateur", "admin@autoecole.sn", "Admin@2024", RoleUser.SUPER_ADMIN);
        }

        // Tout le reste n'existe que pour la démo : en production, ces comptes au mot de passe
        // public donneraient accès à l'application.
        if (!demoComptes) return;
        createIfAbsent("Mamadou Diallo", "moniteur@autoecole.sn",           "Moniteur@2024", RoleUser.MONITEUR);
        createIfAbsent("Fatou Ndiaye",   "fatou.ndiaye@autoecole.sn",       "Moniteur@2024", RoleUser.MONITEUR);
        createIfAbsent("Ibrahima Mbaye", "ibrahima.mbaye@autoecole.sn",     "Moniteur@2024", RoleUser.MONITEUR);
        createIfAbsent("Aliou Sarr",      "eleve@autoecole.sn",              "Eleve@2024",    RoleUser.ELEVE);

        // Élèves existants
        createIfAbsent("Aminata Sarr",   "aminata.sarr@gmail.com",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Oumar Fall",     "oumar.fall@gmail.com",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Sokhna Gueye",   "sokhna.gueye@gmail.com",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Moussa Ba",      "moussa.ba@gmail.com",             "Eleve@2024",    RoleUser.ELEVE);

        // Élèves Diallo Mamadou
        createIfAbsent("Aissatou Diallo",  "aissatou.diallo@test.sn",       "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Boubacar Ndiaye",  "boubacar.ndiaye@test.sn",       "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Mariama Fall",     "mariama.fall@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Oumar Mbaye",      "oumar.mbaye@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Aminata Sy",       "aminata.sy@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Cheikh Sow",       "cheikh.sow@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Pape Cisse",       "pape.cisse@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Adja Gueye",       "adja.gueye@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Lamine Wade",      "lamine.wade@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Rokhaya Faye",     "rokhaya.faye@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Abdoulaye Sene",   "abdoulaye.sene@test.sn",        "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Khady Diouf",      "khady.diouf@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Modou Samb",       "modou.samb@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Yacine Traore",    "yacine.traore@test.sn",         "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Papa Toure",       "papa.toure@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Seynabou Badji",   "seynabou.badji@test.sn",        "Eleve@2024",    RoleUser.ELEVE);

        // Élèves Fatou Ndiaye
        createIfAbsent("Serigne Coly",     "serigne.coly@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Fatoumata Sagna",  "fatoumata.sagna@test.sn",       "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Babacar Drame",    "babacar.drame@test.sn",         "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Ndeye Diop",       "ndeye.diop@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Alioune Lo",       "alioune.lo@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Coumba Ngom",      "coumba.ngom@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Samba Ndao",       "samba.ndao@test.sn",            "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Astou Diagne",     "astou.diagne@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Pathe Camara",     "pathe.camara@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Binta Konate",     "binta.konate@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Idrissa Kone",     "idrissa.kone@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Penda Thiaw",      "penda.thiaw@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Malick Deme",      "malick.deme@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Mame Tendeng",     "mame.tendeng@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("El Hadji Sarr",    "elhadji.sarr@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Nabou Fall",       "nabou.fall@test.sn",            "Eleve@2024",    RoleUser.ELEVE);

        // Élèves Ibrahima Mbaye
        createIfAbsent("Seydou Ba",        "seydou.ba@test.sn",             "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Demba Diallo",     "demba.diallo@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Bigue Ndiaye",     "bigue.ndiaye@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Landing Mbaye",    "landing.mbaye@test.sn",         "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Bocar Sy",         "bocar.sy@test.sn",              "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Mariama Sow",      "mariama.sow@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Aliou Gueye",      "aliou.gueye@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Dieynaba Wade",    "dieynaba.wade@test.sn",         "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Boubacar Cisse",   "boubacar.cisse@test.sn",        "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Rama Faye",        "rama.faye@test.sn",             "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Cheikh Sene",      "cheikh.sene@test.sn",           "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Fatoumata Diouf",  "fatoumata.diouf@test.sn",       "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Babacar Samb",     "babacar.samb@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
        createIfAbsent("Khady Diagne",     "khady.diagne@test.sn",          "Eleve@2024",    RoleUser.ELEVE);
    }

    /**
     * Crée le compte s'il n'existe pas, sans jamais toucher à un compte existant : réécrire
     * le mot de passe à chaque démarrage annulait tout changement (mot de passe admin,
     * identifiants envoyés par le message de bienvenue) et rétablissait des mots de passe
     * publiés dans le README.
     */
    private void createIfAbsent(String nom, String email, String motDePasse, RoleUser role) {
        if (userRepository.findByEmail(email).isPresent()) return;
        userRepository.save(User.builder()
                .nom(nom)
                .email(email)
                .motDePasse(passwordEncoder.encode(motDePasse))
                .role(role)
                .build());
        log.info("Compte {} créé : {}", role, email);
    }
}
