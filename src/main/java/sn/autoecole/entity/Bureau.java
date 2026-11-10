package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Bureau de l'auto-école (appelé « site » dans le code des élèves et l'API, « bureau » à l'écran).
 * Chaque auto-école crée ses bureaux dans Paramètres. Le code est ce que l'élève garde en base
 * (eleves.site, eleves.lieu_inscription) : il ne change jamais, même si le bureau est renommé.
 * Un bureau fermé reste lisible pour les élèves qui y sont déjà, mais n'en reçoit plus de nouveaux.
 */
@Entity
@Table(name = "bureaux")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bureau {

    /** Lieu d'inscription seulement (jamais un bureau) : l'élève est alors suivi par le bureau principal. */
    public static final String EN_LIGNE = "EN_LIGNE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String code;

    @Column(nullable = false)
    private String nom;

    @Column(length = 300)
    private String adresse;

    private String telephone;

    /** Position exacte « latitude,longitude » pour l'itinéraire ; sans elle, on cherche l'adresse. */
    private String localisation;

    @Builder.Default
    @Column(columnDefinition = "boolean default true")
    private boolean actif = true;

    /** Bureau qui suit les élèves inscrits en ligne (un seul à la fois). */
    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    private boolean principal = false;

    @Builder.Default
    @Column(columnDefinition = "integer default 0")
    private int ordre = 0;
}
