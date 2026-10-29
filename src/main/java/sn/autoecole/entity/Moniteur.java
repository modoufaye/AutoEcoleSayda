package sn.autoecole.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import sn.autoecole.enums.CategoriePermis;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "moniteurs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Moniteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Column(nullable = false)
    private String prenom;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Column(nullable = false)
    private String telephone;

    @Email(message = "Format d'email invalide")
    private String email;

    @Column(name = "numero_cni", unique = true)
    private String numeroCni;

    @Column(name = "numero_permis", unique = true)
    private String numeroPermis;

    // Chemin renvoyé par l'upload d'image (/uploads/images/…), null sans photo.
    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "date_embauche")
    private LocalDate dateEmbauche;

    @ElementCollection(targetClass = CategoriePermis.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "moniteur_categories", joinColumns = @JoinColumn(name = "moniteur_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "categorie")
    @Builder.Default
    private Set<CategoriePermis> categoriesAutorisees = new HashSet<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @PrePersist
    private void prePersist() {
        if (dateEmbauche == null) {
            dateEmbauche = LocalDate.now();
        }
    }
}
