package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.MoyenPaiement;
import sn.autoecole.enums.TypePaiement;

import java.math.BigDecimal;

/** Paiement mobile (Wave / Orange Money) déclaré par l'élève, à valider par l'admin. */
@Data
public class DeclarationPaiementRequest {

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être positif")
    private BigDecimal montant;

    @NotNull(message = "Le type de paiement est obligatoire")
    private TypePaiement typePaiement;

    @NotNull(message = "Le moyen de paiement est obligatoire")
    private MoyenPaiement moyenPaiement;

    @NotBlank(message = "L'identifiant de transaction est obligatoire")
    @Size(max = 100, message = "Identifiant de transaction trop long")
    private String transactionId;
}
