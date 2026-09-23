package sn.autoecole.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @NotBlank @Email
    private String email;
    @NotBlank
    private String motDePasse;

    /**
     * Normalise dès la désérialisation, donc AVANT la validation @Email :
     * un espace ajouté par le clavier iOS ou une suggestion QuickType faisait
     * échouer la requête en 400 avant même d'atteindre le service.
     * Le mot de passe, lui, n'est jamais modifié — un espace peut être
     * volontaire.
     */
    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase();
    }
}
