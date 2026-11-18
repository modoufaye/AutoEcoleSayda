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

    private final sn.autoecole.repository.UserRepository userRepository;

    public boolean estEcole(User u) { return ECOLE.contains(u.getRole()); }

    /** Personnel de l'auto-école à qui écrire (comptes actifs : super admin, administrateurs, secrétariat). */
    public List<User> agents() {
        return ECOLE.stream().flatMap(r -> userRepository.findAllByRole(r).stream())
                .filter(User::isActif)
                .sorted(java.util.Comparator.comparing((User x) -> x.getRole() == RoleUser.SECRETAIRE ? 1 : 0).thenComparing(x -> String.valueOf(x.getNom()).toLowerCase()))
                .toList();
    }

    public static String libelle(RoleUser r) {
        return r == RoleUser.SUPER_ADMIN ? "Direction" : r == RoleUser.ADMIN ? "Administration" : "Secrétariat";
    }

    /** « Fatou Diop · Secrétariat » : la personne de l'auto-école d'une discussion. */
    public String nomAgent(Long agentId) {
        return agentId == null ? "L'auto-école" : userRepository.findById(agentId).map(x -> x.getNom() + " · " + libelle(x.getRole())).orElse("L'auto-école");
    }

    /** Destinataire choisi par un élève ou un moniteur : un compte actif du personnel. */
    public User agentValide(Object id) {
        Long v;
        try { v = Long.valueOf(String.valueOf(id)); } catch (NumberFormatException e) { throw new sn.autoecole.exception.BusinessException("Choisissez à qui écrire"); }
        return userRepository.findById(v).filter(x -> estEcole(x) && x.isActif())
                .orElseThrow(() -> new sn.autoecole.exception.BusinessException("Choisissez à qui écrire"));
    }

    /** Fiche du moniteur connecté (null pour les autres comptes). */
    public Moniteur moniteur(User u) {
        return u.getRole() == RoleUser.MONITEUR ? moniteurRepository.findFirstByTelephone(u.getEmail()).orElse(null) : null;
    }

    public MessageEquipe.Cote cote(User u) { return estEcole(u) ? MessageEquipe.Cote.ECOLE : MessageEquipe.Cote.MONITEUR; }

    public boolean accessible(DiscussionEquipe d, User u) {
        if (estEcole(u)) return u.getId().equals(d.getAgentId());   // privée : seulement la personne choisie
        Moniteur m = moniteur(u);
        return m != null && m.getId().equals(d.getMoniteurId());
    }

    public List<DiscussionEquipe> mesDiscussions(User u) {
        if (estEcole(u)) return discussions.findByAgentId(u.getId());
        Moniteur m = moniteur(u);
        return m == null ? List.of() : discussions.findByMoniteurId(m.getId());
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
