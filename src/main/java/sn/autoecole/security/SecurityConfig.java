package sn.autoecole.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Créer un compte (rôle choisi par l'appelant) : admin uniquement. Ouvert à tous,
                // n'importe qui pouvait se créer un compte SUPER_ADMIN. Avant le permitAll
                // de /api/auth/** : la première règle qui correspond l'emporte.
                .requestMatchers("/api/auth/register").hasRole("SUPER_ADMIN")
                // Routes publiques
                .requestMatchers("/api/auth/**").permitAll()
                // Formulaire public « S'inscrire en ligne » (page d'accueil) et ses informations
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                // Page d'erreur Spring : sinon un 403/500 est réécrit en 401 lors du forward
                // vers /error, et le frontend déconnecte l'utilisateur à tort.
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Fichiers uploadés — publics (UUID dans l'URL, pas de données sensibles)
                .requestMatchers("/uploads/**").permitAll()

                // Routes par rôle
                // Secrétaire : consulte les travaux dirigés comme l'admin (le reste de /api/admin lui est fermé)
                .requestMatchers(HttpMethod.GET, "/api/admin/exercices-td").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                // Comptes administrateurs : super admin seulement (l'administrateur n'en crée pas et ne touche pas au super admin)
                .requestMatchers("/api/admin/administrateurs", "/api/admin/administrateurs/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                // Séances de cours : le secrétariat les consulte seulement (création, modification, suppression : non)
                .requestMatchers(HttpMethod.POST, "/api/moniteur/seances", "/api/moniteur/seances/ajouter-eleves").hasAnyRole("MONITEUR", "SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/moniteur/seances/**").hasAnyRole("MONITEUR", "SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/moniteur/seances/**").hasAnyRole("MONITEUR", "SUPER_ADMIN", "ADMIN")
                // Séance de l'administration : un moniteur y ajoute ses élèves
                .requestMatchers(HttpMethod.PATCH, "/api/moniteur/seances/*/eleves").hasRole("MONITEUR")
                .requestMatchers("/api/moniteur/**").hasAnyRole("MONITEUR", "SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                .requestMatchers("/api/eleve/**").hasRole("ELEVE")
                // Travaux Dirigés : séries et annales publiées (l'élève lit les siennes, le secrétariat consulte)
                // Classes d'élèves : bureau et moniteurs (règles fines dans ClasseController)
                .requestMatchers("/api/classes", "/api/classes/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE", "MONITEUR")
                .requestMatchers(HttpMethod.GET, "/api/publications-series/mes").hasRole("ELEVE")
                .requestMatchers(HttpMethod.GET, "/api/publications-series", "/api/publications-series/eleve/*").hasAnyRole("SUPER_ADMIN", "ADMIN", "MONITEUR", "SECRETAIRE")
                .requestMatchers("/api/publications-series", "/api/publications-series/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MONITEUR")
                // Gestion des paiements réservée à l'admin : sinon un élève pourrait
                // valider lui-même un paiement déclaré (PATCH /statut).
                // Secrétaire : encaisse et valide, mais seul l'admin supprime un paiement.
                .requestMatchers(HttpMethod.DELETE, "/api/paiements/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers("/api/paiements/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                // Réinitialise un mot de passe élève : admin uniquement.
                .requestMatchers(HttpMethod.POST, "/api/eleves/*/identifiants", "/api/eleves/*/bienvenue-envoyee").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                .requestMatchers(HttpMethod.POST, "/api/eleves/import").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                // Documents du dossier d'un élève (CNI, certificats, dossier Service des Mines) :
                // admin uniquement ; les moniteurs n'y ont plus accès, ni à l'écran ni par l'API.
                .requestMatchers("/api/eleves/*/documents", "/api/eleves/*/documents/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                // Archiver / réactiver un élève : admin uniquement.
                .requestMatchers(HttpMethod.PATCH, "/api/eleves/*/archiver", "/api/eleves/*/reactiver").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                .requestMatchers(HttpMethod.PATCH, "/api/eleves/*/documents-remis").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                // Supprimer un élève (et son compte de connexion) : admin uniquement.
                .requestMatchers(HttpMethod.DELETE, "/api/eleves/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                // Gestion des élèves (liste, fiches, comptes) : jamais pour un élève,
                // qui passe par /api/eleve/** (au singulier) pour ses propres données.
                .requestMatchers("/api/eleves/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MONITEUR", "SECRETAIRE")
                // Créer, modifier, supprimer un moniteur ou lui créer son compte : admin uniquement.
                // Avant, ces routes relevaient de anyRequest().authenticated() : un élève pouvait les appeler.
                .requestMatchers(HttpMethod.POST, "/api/moniteurs/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                // Véhicules : le moniteur peut modifier, mais l'ajout et la suppression sont réservés à l'admin
                .requestMatchers(HttpMethod.POST, "/api/vehicules", "/api/vehicules/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/vehicules/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/moniteurs/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/moniteurs/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/moniteurs/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                // Demandes d'inscription en ligne : approuvées ou refusées par l'admin ou le secrétariat.
                .requestMatchers("/api/demandes-inscription/**", "/api/demandes-inscription").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                // Débloquer un compte (5 mots de passe faux) : admin, et secrétariat pour élèves et moniteurs.
                .requestMatchers("/api/comptes-bloques/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE")
                // Annonces : tous les comptes lisent et marquent lues ; le personnel publie et supprime
                .requestMatchers(HttpMethod.POST, "/api/annonces/lues").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/annonces").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE", "MONITEUR")
                .requestMatchers(HttpMethod.DELETE, "/api/annonces/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "SECRETAIRE", "MONITEUR")
                // Médiathèque (vidéos et audios français / wolof) : personnel ; les élèves passent par /api/eleve/medias
                .requestMatchers("/api/medias", "/api/medias/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MONITEUR")
                // Explications en wolof : déposées par l'administration et les moniteurs, écoutées par tous
                .requestMatchers(HttpMethod.PUT, "/api/audios-wolof").hasAnyRole("SUPER_ADMIN", "ADMIN", "MONITEUR")
                .requestMatchers(HttpMethod.DELETE, "/api/audios-wolof").hasAnyRole("SUPER_ADMIN", "ADMIN", "MONITEUR")
                // Visites du site (adresses IP) : super admin seul
                .requestMatchers("/api/journal/visites").hasRole("SUPER_ADMIN")
                // Journal des actions : super admin (tout) et administrateurs (leurs actions et celles du secrétariat)
                .requestMatchers("/api/journal", "/api/journal/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                // Statistiques globales (dont le total encaissé) : pas pour les élèves.
                .requestMatchers("/api/dashboard/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MONITEUR", "SECRETAIRE")

                // Toutes les autres routes nécessitent une authentification
                .anyRequest().authenticated()
            )
            // Token absent/expiré → 401 (et non 403 par défaut), pour que le
            // frontend purge la session et redirige vers /login.
            .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .headers(h -> h.frameOptions(f -> f.sameOrigin()))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        /*
         * Origines de DÉVELOPPEMENT uniquement.
         *   - localhost/127.0.0.1 sur n'importe quel port : `vite dev` (5173)
         *     comme `vite preview` (4173).
         *   - plages d'IP privées : indispensable pour tester depuis un vrai
         *     téléphone sur le Wi-Fi local (ex. http://192.168.1.12:4173).
         *
         * En production, nginx sert le frontend ET relaie /api sur la même
         * origine : les requêtes sont same-origin et ne passent donc jamais
         * par ce filtre. Ces motifs n'élargissent pas la surface exposée.
         *
         * setAllowedOriginPatterns (et non setAllowedOrigins) : les jokers
         * sont interdits par la spec avec allowCredentials(true).
         */
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*.*:*",
                "http://10.*.*.*:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
