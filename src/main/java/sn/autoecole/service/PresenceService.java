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
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Qui est en ligne : dernière requête de chaque compte, gardée en mémoire (rien en base).
 * La page ouverte interroge le serveur toutes les 30 secondes (messages non lus) : un compte
 * sans requête depuis {@link #DELAI} est hors ligne. Un redémarrage du serveur remet tout à zéro.
 * La première activité d'un élève est aussi notée sur sa fiche (premiereConnexionLe).
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    public static final Duration DELAI = Duration.ofMinutes(2);

    /** Compte vu en dernier : identifiant (téléphone ou e-mail), rôle et instant. */
    public record Vu(String identifiant, RoleUser role, Instant le) {}

    private final Map<Long, Vu> vus = new ConcurrentHashMap<>();
    /** Comptes élèves déjà vérifiés depuis le démarrage : la fiche n'est lue qu'une fois. */
    private final Set<Long> elevesVerifies = ConcurrentHashMap.newKeySet();
    private final EleveRepository eleveRepository;

    public void noter(User u) {
        vus.put(u.getId(), new Vu(u.getEmail(), u.getRole(), Instant.now()));
        if (u.getRole() == RoleUser.ELEVE && elevesVerifies.add(u.getId()))
            eleveRepository.findFirstByTelephone(u.getEmail()).filter(e -> e.getPremiereConnexionLe() == null).ifPresent(e -> {
                e.setPremiereConnexionLe(LocalDateTime.now());
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
