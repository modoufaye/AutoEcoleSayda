package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import sn.autoecole.enums.RoleUser;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    // Identifiant de connexion : l'email pour l'admin et les moniteurs, le numéro de
    // téléphone (Telephones.normaliser) pour les élèves.
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleUser role;

    /** false : connexion refusée (élève archivé). Les comptes existants valent true via le default SQL. */
    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private boolean actif = true;

    /** Mots de passe faux d'affilée ; remis à zéro à la connexion réussie ou au déblocage. */
    @Column(name = "echecs_connexion", columnDefinition = "integer default 0")
    @Builder.Default
    private Integer echecsConnexion = 0;

    /** Bloqué après MAX_ECHECS essais faux : refusé même avec le bon mot de passe, jusqu'au
        déblocage par l'admin ou le secrétariat (ou de nouveaux identifiants). */
    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private boolean bloque = false;

    public static final int MAX_ECHECS = 5;

    /** Débloque le compte et remet le compteur d'essais à zéro. */
    public void debloquer() {
        bloque = false;
        echecsConnexion = 0;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String getPassword()  { return motDePasse; }
    @Override public String getUsername()  { return email; }
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return !bloque; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return actif; }
}
