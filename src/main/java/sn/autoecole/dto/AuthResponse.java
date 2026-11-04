package sn.autoecole.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import sn.autoecole.enums.RoleUser;

@Data @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String nom;
    private String email;
    private RoleUser role;
    /** Admin ou secrétaire dont le mot de passe fait moins de 10 caractères : à changer tout de suite. */
    private boolean changerMotDePasse;
}
