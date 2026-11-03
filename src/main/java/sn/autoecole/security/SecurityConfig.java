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
                .requestMatchers("/h2-console/**").permitAll()
                // Page d'erreur Spring : sinon un 403/500 est réécrit en 401 lors du forward
                // vers /error, et le frontend déconnecte l'utilisateur à tort.
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Fichiers uploadés — publics (UUID dans l'URL, pas de données sensibles)
                .requestMatchers("/uploads/**").permitAll()

                // Routes par rôle
                // Secrétaire : consulte les travaux dirigés comme l'admin (le reste de /api/admin lui est fermé)
                .requestMatchers(HttpMethod.GET, "/api/admin/exercices-td").hasAnyRole("SUPER_ADMIN", "SECRETAIRE")
                .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/moniteur/**").hasAnyRole("MONITEUR", "SUPER_ADMIN", "SECRETAIRE")
                .requestMatchers("/api/eleve/**").hasRole("ELEVE")
                // Gestion des paiements réservée à l'admin : sinon un élève pourrait
                // valider lui-même un paiement déclaré (PATCH /statut).
                // Secrétaire : encaisse et valide, mais seul l'admin supprime un paiement.
                .requestMatchers(HttpMethod.DELETE, "/api/paiements/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/paiements/**").hasAnyRole("SUPER_ADMIN", "SECRETAIRE")
                // Réinitialise un mot de passe élève : admin uniquement.
                .requestMatchers(HttpMethod.POST, "/api/eleves/*/identifiants").hasAnyRole("SUPER_ADMIN", "SECRETAIRE")
                .requestMatchers(HttpMethod.POST, "/api/eleves/import").hasAnyRole("SUPER_ADMIN", "SECRETAIRE")
                // Documents du dossier d'un élève (CNI, certificats, dossier Service des Mines) :
                // admin uniquement ; les moniteurs n'y ont plus accès, ni à l'écran ni par l'API.
                .requestMatchers("/api/eleves/*/documents", "/api/eleves/*/documents/**").hasAnyRole("SUPER_ADMIN", "SECRETAIRE")
                // Archiver / réactiver un élève : admin uniquement.
                .requestMatchers(HttpMethod.PATCH, "/api/eleves/*/archiver", "/api/eleves/*/reactiver").hasAnyRole("SUPER_ADMIN", "SECRETAIRE")
                // Supprimer un élève (et son compte de connexion) : admin uniquement.
                .requestMatchers(HttpMethod.DELETE, "/api/eleves/**").hasRole("SUPER_ADMIN")
                // Gestion des élèves (liste, fiches, comptes) : jamais pour un élève,
                // qui passe par /api/eleve/** (au singulier) pour ses propres données.
                .requestMatchers("/api/eleves/**").hasAnyRole("SUPER_ADMIN", "MONITEUR", "SECRETAIRE")
                // Créer, modifier, supprimer un moniteur ou lui créer son compte : admin uniquement.
                // Avant, ces routes relevaient de anyRequest().authenticated() : un élève pouvait les appeler.
                .requestMatchers(HttpMethod.POST, "/api/moniteurs/**").hasRole("SUPER_ADMIN")
                // Véhicules : le moniteur peut modifier, mais l'ajout et la suppression sont réservés à l'admin
                .requestMatchers(HttpMethod.POST, "/api/vehicules", "/api/vehicules/**").hasRole("SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/vehicules/**").hasRole("SUPER_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/moniteurs/**").hasRole("SUPER_ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/moniteurs/**").hasRole("SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/moniteurs/**").hasRole("SUPER_ADMIN")
                // Statistiques globales (dont le total encaissé) : pas pour les élèves.
                .requestMatchers("/api/dashboard/**").hasAnyRole("SUPER_ADMIN", "MONITEUR", "SECRETAIRE")

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
