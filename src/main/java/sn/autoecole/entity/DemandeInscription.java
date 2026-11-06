package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.autoecole.enums.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Inscription faite en ligne par le candidat (page d'accueil). Ce n'est pas encore un élève :
 * pas de compte, rien dans la caisse. La secrétaire ou l'admin vérifie l'acompte (Wave / Orange
 * Money, référence de transaction) puis approuve (l'élève est créé) ou refuse.
 */
@Entity
@Table(name = "demandes_inscription")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DemandeInscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String nom;

    /** Normalisé (Telephones) : deviendra l'identifiant de connexion de l'élève. */
    @Column(nullable = false)
    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_formation", nullable = false)
    private TypeFormation typeFormation;

    /** Permis : A, B, C ou D. Perfectionnement : null (B fixé à l'approbation). */
    @Enumerated(EnumType.STRING)
    @Column(name = "categorie_permis")
    private CategoriePermis categoriePermis;

    /** Perfectionnement seulement. */
    @Enumerated(EnumType.STRING)
    @Column(name = "boite_vitesse")
    private BoiteVitesse boiteVitesse;

    /** Formule choisie (même libellé que sur la fiche élève), null si aucune. */
    @Column(length = 80)
    private String formule;

    /** Montant de la formule au jour de la demande (Paramètres) ; proposé comme total à l'approbation. */
    @Column(name = "montant_formule", precision = 12, scale = 2)
    private BigDecimal montantFormule;

    @Column(name = "montant_acompte", nullable = false, precision = 12, scale = 2)
    private BigDecimal montantAcompte;

    @Enumerated(EnumType.STRING)
    @Column(name = "moyen_paiement", nullable = false)
    private MoyenPaiement moyenPaiement;

    /** Référence Wave / Orange Money : n'est plus demandée (null pour les nouvelles demandes). */
    @Column(name = "transaction_id")
    private String transactionId;

    /** Date d'inscription : le jour de la demande. */
    @Column(name = "date_demande", nullable = false)
    private LocalDate dateDemande;

    @Column(name = "cree_le", nullable = false)
    private LocalDateTime creeLe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    /** Élève créé à l'approbation. */
    @Column(name = "eleve_id")
    private Long eleveId;

    @Column(name = "motif_refus")
    private String motifRefus;

    /** Compte (identifiant) de la personne qui a approuvé ou refusé. */
    @Column(name = "traite_par")
    private String traitePar;

    @Column(name = "traite_le")
    private LocalDateTime traiteLe;
}
