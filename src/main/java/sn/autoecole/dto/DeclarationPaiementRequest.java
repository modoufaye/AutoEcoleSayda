package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.MoyenPaiement;

import java.math.BigDecimal;

/** Paiement mobile (Wave / Orange Money) déclaré par l'élève, à valider par l'admin. */
@Data
public class DeclarationPaiementRequest {

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être positif")
    private BigDecimal montant;


    @NotNull(message = "Le moyen de paiement est obligatoire")
    private MoyenPaiement moyenPaiement;

    /** Facultatif : n'est plus demandé à l'élève ; l'auto-école vérifie par le montant et le numéro. */
    @Size(max = 100, message = "Identifiant de transaction trop long")
    private String transactionId;
}
