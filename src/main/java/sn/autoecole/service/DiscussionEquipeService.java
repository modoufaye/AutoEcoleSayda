package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.DiscussionEquipe;
import sn.autoecole.entity.MessageEquipe;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.DiscussionEquipeRepository;
import sn.autoecole.repository.MessageEquipeRepository;
import sn.autoecole.repository.MoniteurRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Discussions moniteur ↔ auto-école : qui y a accès et combien de messages restent non lus.
 * Côté auto-école, la boîte est partagée (super admin, administrateurs, secrétariat).
 */
@Service
@RequiredArgsConstructor
public class DiscussionEquipeService {

    public static final Set<RoleUser> ECOLE = Set.of(RoleUser.SUPER_ADMIN, RoleUser.ADMIN, RoleUser.SECRETAIRE);

    private final DiscussionEquipeRepository discussions;
    private final MessageEquipeRepository messages;
    private final MoniteurRepository moniteurRepository;

    public boolean estEcole(User u) { return ECOLE.contains(u.getRole()); }

    /** Fiche du moniteur connecté (null pour les autres comptes). */
    public Moniteur moniteur(User u) {
        return u.getRole() == RoleUser.MONITEUR ? moniteurRepository.findFirstByTelephone(u.getEmail()).orElse(null) : null;
    }

    public MessageEquipe.Cote cote(User u) { return estEcole(u) ? MessageEquipe.Cote.ECOLE : MessageEquipe.Cote.MONITEUR; }

    public boolean accessible(DiscussionEquipe d, User u) {
        if (estEcole(u)) return true;
        Moniteur m = moniteur(u);
        return m != null && m.getId().equals(d.getMoniteurId());
    }

    public List<DiscussionEquipe> mesDiscussions(User u) {
        if (estEcole(u)) return discussions.findAll();
        Moniteur m = moniteur(u);
        if (m == null) return List.of();
        Optional<DiscussionEquipe> d = discussions.findFirstByMoniteurId(m.getId());
        return d.map(List::of).orElse(List.of());
    }

    public long nonLus(DiscussionEquipe d, User u) {
        boolean ecole = estEcole(u);
        MessageEquipe.Cote autre = ecole ? MessageEquipe.Cote.MONITEUR : MessageEquipe.Cote.ECOLE;
        LocalDateTime lu = ecole ? d.getEcoleLuLe() : d.getMoniteurLuLe();
        return lu == null ? messages.countByDiscussionIdAndCote(d.getId(), autre)
                : messages.countByDiscussionIdAndCoteAndEnvoyeLeAfter(d.getId(), autre, lu);
    }

    /** Total des messages non lus de l'équipe (0 pour un élève). */
    @Transactional(readOnly = true)
    public long totalNonLus(User u) {
        if (u.getRole() == RoleUser.ELEVE) return 0;
        return mesDiscussions(u).stream().mapToLong(d -> nonLus(d, u)).sum();
    }
}
