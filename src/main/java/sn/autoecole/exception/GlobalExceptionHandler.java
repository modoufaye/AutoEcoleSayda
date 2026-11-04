package sn.autoecole.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusiness(BusinessException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Paramètre d'URL invalide (ex. type de document inconnu) : erreur du client, pas 500. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Valeur invalide pour « " + ex.getName() + " » : " + ex.getValue());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            erreurs.put(field, error.getDefaultMessage());
        });
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("erreurs", erreurs);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Identifiants invalides : c'est une erreur du client, pas une panne serveur.
     * Couvre BadCredentialsException (mauvais mot de passe) et
     * InternalAuthenticationServiceException (qui encapsule UsernameNotFoundException
     * quand l'email est inconnu) — les deux héritent d'AuthenticationException.
     *
     * Le message reste volontairement identique dans les deux cas : indiquer
     * « email inconnu » plutôt que « mot de passe incorrect » permettrait
     * d'énumérer les comptes existants.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationException ex) {
        // Compte bloqué après 5 essais faux (AuthService) : refusé même avec le bon mot de passe
        if (ex instanceof LockedException)
            return buildResponse(HttpStatus.UNAUTHORIZED,
                    "Compte bloqué après 5 mots de passe incorrects. Demandez à l'auto-école de le débloquer.");
        // Avertissement des derniers essais, posé par AuthService ; sinon le message générique
        String msg = ex.getMessage() != null && ex.getMessage().contains("Attention") ? ex.getMessage() : "Email ou mot de passe incorrect";
        return buildResponse(HttpStatus.UNAUTHORIZED, msg);
    }

    /** Adresse inexistante : 404, et non 500 via le handler générique ci-dessous. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResource(NoResourceFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "Ressource introuvable : /" + ex.getResourcePath());
    }

    // Refus ou absence signalés volontairement par un contrôleur (403 cours de code, 404 profil…) :
    // on garde leur code au lieu de les transformer en erreur 500.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        return buildResponse(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getReason() != null ? ex.getReason() : ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne du serveur: " + ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
