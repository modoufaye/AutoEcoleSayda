package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaiementRequest {

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être positif")
    private BigDecimal montant;

    @NotNull(message = "L'id de l'élève est obligatoire")
    private Long eleveId;


    private StatutPaiement statut;

    private String description;
}
