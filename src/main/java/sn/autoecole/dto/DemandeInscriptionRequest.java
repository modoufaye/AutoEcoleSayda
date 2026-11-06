package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.MoyenPaiement;

import java.math.BigDecimal;

/** Formulaire public « S'inscrire en ligne ». */
@Data
public class DemandeInscriptionRequest {
    @NotBlank(message = "Le prénom est obligatoire") @Size(max = 80)
    private String prenom;
    @NotBlank(message = "Le nom est obligatoire") @Size(max = 80)
    private String nom;
    @NotBlank(message = "Le téléphone est obligatoire") @Size(max = 30)
    private String telephone;
    /** A, B, C, D, CP_M (perfectionnement boîte manuelle) ou CP_A (automatique). */
    @NotBlank(message = "Choisissez votre formation")
    private String formation;
    /** Formule choisie : Standard, Premium… (permis) ou nombre de cours (perfectionnement, ex. « 15 »). */
    @Size(max = 40)
    private String formule;
    @NotNull(message = "Le montant de l'acompte est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "L'acompte doit être positif")
    private BigDecimal montantAcompte;
    @NotNull(message = "Choisissez Wave ou Orange Money")
    private MoyenPaiement moyenPaiement;
    /** Facultative : n'est plus demandée sur la page d'inscription. */
    @Size(max = 100)
    private String transactionId;
    /** Champ piège invisible : un robot le remplit, une personne non. */
    private String siteWeb;
}
