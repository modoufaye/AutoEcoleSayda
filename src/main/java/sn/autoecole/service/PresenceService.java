package sn.autoecole.service;

import org.springframework.stereotype.Service;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Qui est en ligne : dernière requête de chaque compte, gardée en mémoire (rien en base).
 * La page ouverte interroge le serveur toutes les 30 secondes (messages non lus) : un compte
 * sans requête depuis {@link #DELAI} est hors ligne. Un redémarrage du serveur remet tout à zéro.
 */
@Service
public class PresenceService {

    public static final Duration DELAI = Duration.ofMinutes(2);

    /** Compte vu en dernier : identifiant (téléphone ou e-mail), rôle et instant. */
    public record Vu(String identifiant, RoleUser role, Instant le) {}

    private final Map<Long, Vu> vus = new ConcurrentHashMap<>();

    public void noter(User u) {
        vus.put(u.getId(), new Vu(u.getEmail(), u.getRole(), Instant.now()));
    }

    /** Déconnexion : le compte passe hors ligne tout de suite. */
    public void partir(User u) {
        vus.remove(u.getId());
    }

    public List<Vu> enLigne() {
        Instant limite = Instant.now().minus(DELAI);
        vus.values().removeIf(v -> v.le().isBefore(limite));
        return List.copyOf(vus.values());
    }
}
