package sn.autoecole.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    // Email (admin, moniteur) ou numéro de téléphone (élève). Le nom du champ JSON est conservé.
    @NotBlank
    private String email;
    @NotBlank
    private String motDePasse;

    /**
     * Normalise dès la désérialisation, donc AVANT la validation :
     * un espace ajouté par le clavier iOS ou une suggestion QuickType faisait
     * échouer la requête en 400 avant même d'atteindre le service.
     * Le mot de passe, lui, n'est jamais modifié — un espace peut être
     * volontaire.
     */
    public void setEmail(String email) {
        if (email == null) { this.email = null; return; }
        String s = email.trim();
        this.email = s.contains("@") ? s.toLowerCase() : sn.autoecole.util.Telephones.normaliser(s);
    }
}
