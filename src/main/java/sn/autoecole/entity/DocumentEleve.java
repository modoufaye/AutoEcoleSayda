package sn.autoecole.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import sn.autoecole.enums.TypeDocument;

import java.time.LocalDateTime;

/** Pièce jointe (image ou PDF) du dossier d'un élève. Le fichier est sur disque, hors du dossier public uploads/. */
@Entity
@Table(name = "documents_eleves")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DocumentEleve {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "eleve_id", nullable = false)
    @JsonIgnore
    private Eleve eleve;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeDocument type;

    /** Nom du fichier tel qu'envoyé, affiché à l'écran. */
    @Column(name = "nom_fichier", nullable = false)
    private String nomFichier;

    /** Nom sur disque (UUID) : jamais exposé, l'accès passe par l'API authentifiée. */
    @Column(name = "nom_stockage", nullable = false, unique = true)
    @JsonIgnore
    private String nomStockage;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    private long taille;

    @Column(name = "date_ajout", nullable = false)
    private LocalDateTime dateAjout;
}
