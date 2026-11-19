package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.EleveRepository;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Qui est en ligne : dernière requête de chaque compte, gardée en mémoire (rien en base).
 * La page ouverte interroge le serveur toutes les 30 secondes (messages non lus) : un compte
 * sans requête depuis {@link #DELAI} est hors ligne. Un redémarrage du serveur remet tout à zéro.
 * La première et la dernière activité d'un élève sont aussi notées sur sa fiche (premiereConnexionLe,
 * derniereActiviteLe, celle-ci au plus une fois par heure).
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    public static final Duration DELAI = Duration.ofMinutes(2);

    /** Compte vu en dernier : identifiant (téléphone ou e-mail), rôle et instant. */
    public record Vu(String identifiant, RoleUser role, Instant le) {}

    private final Map<Long, Vu> vus = new ConcurrentHashMap<>();
    /** Élèves : dernière activité écrite sur la fiche (au plus une écriture par heure et par élève). */
    private final Map<Long, Instant> activiteNotee = new ConcurrentHashMap<>();
    private static final Duration PAS_ACTIVITE = Duration.ofHours(1);
    private final EleveRepository eleveRepository;

    public void noter(User u) {
        vus.put(u.getId(), new Vu(u.getEmail(), u.getRole(), Instant.now()));
        if (u.getRole() != RoleUser.ELEVE) return;
        Instant maintenant = Instant.now(), avant = activiteNotee.get(u.getId());
        if (avant != null && avant.isAfter(maintenant.minus(PAS_ACTIVITE))) return;
        activiteNotee.put(u.getId(), maintenant);
        eleveRepository.findFirstByTelephone(u.getEmail()).ifPresent(e -> {
            LocalDateTime now = LocalDateTime.now();
            if (e.getPremiereConnexionLe() == null) e.setPremiereConnexionLe(now);
            e.setDerniereActiviteLe(now);
            eleveRepository.save(e);
        });
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
