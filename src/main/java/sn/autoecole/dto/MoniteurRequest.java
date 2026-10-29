package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.CategoriePermis;

import java.time.LocalDate;
import java.util.Set;

@Data
public class MoniteurRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Le téléphone est obligatoire")
    private String telephone;

    @Email(message = "Format d'email invalide")
    private String email;

    private String numeroCni;

    private String numeroPermis;

    private LocalDate dateEmbauche;

    // Seulement une image envoyée sur le serveur : pas d'URL externe arbitraire.
    @Pattern(regexp = "/uploads/images/[\\w.-]+", message = "Photo invalide")
    private String photoUrl;

    private Set<CategoriePermis> categoriesAutorisees;

    private Boolean actif;
}
