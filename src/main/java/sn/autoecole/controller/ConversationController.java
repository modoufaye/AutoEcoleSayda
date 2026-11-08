package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.Conversation;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.MessagePrive;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.ConversationRepository;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MessagePriveRepository;
import sn.autoecole.repository.MoniteurRepository;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Conversations privées élève ↔ auto-école (boîte partagée : super admin, administrateurs,
 * secrétariat) et élève ↔ son moniteur. Chacun ne voit que ses conversations : l'élève les siennes,
 * le moniteur celles de ses élèves avec lui, l'administration et le secrétariat celles avec
 * l'auto-école. Le contenu des messages n'est pas écrit dans le journal.
 */
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private static final Set<RoleUser> ECOLE = Set.of(RoleUser.SUPER_ADMIN, RoleUser.ADMIN, RoleUser.SECRETAIRE);

    private final ConversationRepository conversations;
    private final MessagePriveRepository messages;
    private final EleveRepository eleveRepository;
    private final MoniteurRepository moniteurRepository;

    private record Lecteur(User user, Eleve eleve, Moniteur moniteur) {
        boolean estEleve() { return user.getRole() == RoleUser.ELEVE; }
        MessagePrive.Cote cote() { return estEleve() ? MessagePrive.Cote.ELEVE : MessagePrive.Cote.EQUIPE; }
    }

    private Lecteur lecteur(Authentication auth) {
        User u = (User) auth.getPrincipal();
        Eleve e = u.getRole() == RoleUser.ELEVE ? eleveRepository.findFirstByTelephone(u.getEmail())
                .orElseThrow(() -> new BusinessException("Fiche élève introuvable pour ce compte")) : null;
        Moniteur m = u.getRole() == RoleUser.MONITEUR ? moniteurRepository.findFirstByTelephone(u.getEmail()).orElse(null) : null;
        return new Lecteur(u, e, m);
    }

    private static boolean accessible(Conversation c, Lecteur l) {
        if (l.estEleve()) return c.getEleve().getId().equals(l.eleve().getId());
        if (l.user().getRole() == RoleUser.MONITEUR)
            return c.getType() == Conversation.Type.MONITEUR && l.moniteur() != null && l.moniteur().getId().equals(c.getMoniteurId());
        return ECOLE.contains(l.user().getRole()) && c.getType() == Conversation.Type.ECOLE;
    }

    private List<Conversation> mesConversations(Lecteur l) {
        if (l.estEleve()) return conversations.findByEleveId(l.eleve().getId());
        if (l.user().getRole() == RoleUser.MONITEUR)
            return l.moniteur() == null ? List.of() : conversations.findByTypeAndMoniteurId(Conversation.Type.MONITEUR, l.moniteur().getId());
        return ECOLE.contains(l.user().getRole()) ? conversations.findByType(Conversation.Type.ECOLE) : List.of();
    }

    private long nonLus(Conversation c, Lecteur l) {
        MessagePrive.Cote autre = l.estEleve() ? MessagePrive.Cote.EQUIPE : MessagePrive.Cote.ELEVE;
        LocalDateTime lu = l.estEleve() ? c.getEleveLuLe() : c.getEquipeLuLe();
        return lu == null ? messages.countByConversationIdAndCote(c.getId(), autre)
                : messages.countByConversationIdAndCoteAndEnvoyeLeAfter(c.getId(), autre, lu);
    }

    /** Pour l'élève : « Auto-École Khadija » ou le nom du moniteur ; pour l'équipe : le nom de l'élève. */
    private String interlocuteur(Conversation c, Lecteur l) {
        if (!l.estEleve()) return c.getEleve().getPrenom() + " " + c.getEleve().getNom();
        if (c.getType() == Conversation.Type.ECOLE) return "Auto-École Khadija";
        return moniteurRepository.findById(c.getMoniteurId()).map(m -> "Moniteur · " + m.getPrenom() + " " + m.getNom()).orElse("Votre moniteur");
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> lister(Authentication auth) {
        Lecteur l = lecteur(auth);
        return mesConversations(l).stream()
                .filter(c -> c.getDernierMessageLe() != null)
                .sorted(Comparator.comparing(Conversation::getDernierMessageLe).reversed())
                .map(c -> {
                    Map<String, Object> v = new LinkedHashMap<>();
                    v.put("id", c.getId()); v.put("type", c.getType()); v.put("eleveId", c.getEleve().getId());
                    v.put("titre", interlocuteur(c, l));
                    v.put("telephone", l.estEleve() ? null : c.getEleve().getTelephone());
                    v.put("dernierLe", c.getDernierMessageLe());
                    messages.findFirstByConversationIdOrderByEnvoyeLeDescIdDesc(c.getId()).ifPresent(m ->
                            v.put("apercu", (m.getCote() == l.cote() ? "Vous : " : "") + (m.getTexte().length() > 80 ? m.getTexte().substring(0, 80) + "…" : m.getTexte())));
                    v.put("nonLus", nonLus(c, l));
                    return v;
                }).toList();
    }

    @GetMapping("/non-lus")
    @Transactional(readOnly = true)
    public Map<String, Long> totalNonLus(Authentication auth) {
        Lecteur l = lecteur(auth);
        return Map.of("nombre", mesConversations(l).stream().mapToLong(c -> nonLus(c, l)).sum());
    }

    /** Messages de la conversation ; la lire marque les messages reçus comme lus (de son côté). */
    @GetMapping("/{id}/messages")
    @Transactional
    public Map<String, Object> lire(@PathVariable Long id, Authentication auth) {
        Lecteur l = lecteur(auth);
        return contenu(trouver(id, l), l, true);
    }

    /**
     * Fiche élève (personnel) : la conversation avec cet élève (auto-école, ou le moniteur avec son
     * élève), sans la créer tant qu'aucun message n'est envoyé. lire=true : ses messages passent lus.
     */
    @GetMapping("/eleve/{eleveId}")
    @Transactional
    public Map<String, Object> avecEleve(@PathVariable Long eleveId, @RequestParam(defaultValue = "false") boolean lire, Authentication auth) {
        Lecteur l = lecteur(auth);
        if (l.estEleve()) throw new BusinessException("Réservé au personnel");
        Eleve eleve = eleveRepository.findById(eleveId).orElseThrow(() -> new ResourceNotFoundException("Élève introuvable"));
        Optional<Conversation> c;
        if (l.user().getRole() == RoleUser.MONITEUR) {
            if (l.moniteur() == null || eleve.getMoniteur() == null || !eleve.getMoniteur().getId().equals(l.moniteur().getId()))
                throw new BusinessException("Vous écrivez seulement à vos élèves");
            c = conversations.findFirstByEleveIdAndTypeAndMoniteurId(eleveId, Conversation.Type.MONITEUR, l.moniteur().getId());
        } else c = conversations.findFirstByEleveIdAndTypeAndMoniteurIdIsNull(eleveId, Conversation.Type.ECOLE);
        if (c.isEmpty()) {
            Map<String, Object> vide = new LinkedHashMap<>();
            vide.put("id", null); vide.put("messages", List.of()); vide.put("nonLus", 0);
            return vide;
        }
        long nonLus = nonLus(c.get(), l);
        Map<String, Object> r = new LinkedHashMap<>(contenu(c.get(), l, lire));
        r.put("nonLus", lire ? 0 : nonLus);
        return r;
    }

    private Map<String, Object> contenu(Conversation c, Lecteur l, boolean marquerLu) {
        if (marquerLu) {
            if (l.estEleve()) c.setEleveLuLe(LocalDateTime.now()); else c.setEquipeLuLe(LocalDateTime.now());
            conversations.save(c);
        }
        List<Map<String, Object>> liste = messages.findByConversationIdOrderByEnvoyeLeAscIdAsc(c.getId()).stream().map(m -> {
            Map<String, Object> v = new LinkedHashMap<>();
            v.put("id", m.getId()); v.put("texte", m.getTexte()); v.put("envoyeLe", m.getEnvoyeLe());
            v.put("deMoi", m.getCote() == l.cote());
            v.put("auteur", m.getCote() == MessagePrive.Cote.ELEVE ? c.getEleve().getPrenom() + " " + c.getEleve().getNom() : m.getAuteurNom());
            return v;
        }).toList();
        return Map.of("id", c.getId(), "titre", interlocuteur(c, l), "messages", liste);
    }

    /** Corps : { texte }. */
    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> envoyer(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Lecteur l = lecteur(auth);
        Conversation c = trouver(id, l);
        String texte = body.get("texte") == null ? "" : body.get("texte").trim();
        if (texte.isEmpty()) throw new BusinessException("Écrivez votre message");
        if (texte.length() > 2000) throw new BusinessException("Message trop long (2 000 caractères au plus)");
        LocalDateTime maintenant = LocalDateTime.now();
        MessagePrive m = messages.save(MessagePrive.builder().conversationId(c.getId()).cote(l.cote()).auteurId(l.user().getId())
                .auteurNom(l.user().getRole() == RoleUser.SUPER_ADMIN ? "Auto-École Khadija" : l.user().getNom())   // comme pour les cours publiés
                .texte(texte).envoyeLe(maintenant).build());
        c.setDernierMessageLe(maintenant);
        if (l.estEleve()) c.setEleveLuLe(maintenant); else c.setEquipeLuLe(maintenant);
        conversations.save(c);
        return Map.of("id", m.getId());
    }

    /**
     * Ouvre (ou retrouve) une conversation. Élève : { type: ECOLE | MONITEUR } (son moniteur).
     * Auto-école : { eleveId } ; moniteur : { eleveId } d'un de ses élèves.
     */
    @PostMapping
    @Transactional
    public Map<String, Object> ouvrir(@RequestBody Map<String, String> body, Authentication auth) {
        Lecteur l = lecteur(auth);
        Eleve eleve; Conversation.Type type; Long moniteurId = null;
        if (l.estEleve()) {
            eleve = l.eleve();
            type = "MONITEUR".equals(body.get("type")) ? Conversation.Type.MONITEUR : Conversation.Type.ECOLE;
            if (type == Conversation.Type.MONITEUR) {
                if (eleve.getMoniteur() == null) throw new BusinessException("Aucun moniteur ne vous est encore attribué");
                moniteurId = eleve.getMoniteur().getId();
            }
        } else {
            Long eleveId;
            try { eleveId = Long.valueOf(String.valueOf(body.get("eleveId"))); } catch (NumberFormatException e) { throw new BusinessException("Choisissez l'élève"); }
            eleve = eleveRepository.findById(eleveId).orElseThrow(() -> new ResourceNotFoundException("Élève introuvable"));
            if (l.user().getRole() == RoleUser.MONITEUR) {
                if (l.moniteur() == null || eleve.getMoniteur() == null || !eleve.getMoniteur().getId().equals(l.moniteur().getId()))
                    throw new BusinessException("Vous écrivez seulement à vos élèves");
                type = Conversation.Type.MONITEUR; moniteurId = l.moniteur().getId();
            } else type = Conversation.Type.ECOLE;
        }
        Long mid = moniteurId;
        Optional<Conversation> existante = type == Conversation.Type.ECOLE
                ? conversations.findFirstByEleveIdAndTypeAndMoniteurIdIsNull(eleve.getId(), type)
                : conversations.findFirstByEleveIdAndTypeAndMoniteurId(eleve.getId(), type, mid);
        Eleve e = eleve; Conversation.Type t = type;
        Conversation c = existante.orElseGet(() -> conversations.save(Conversation.builder().eleve(e).type(t).moniteurId(mid).creeLe(LocalDateTime.now()).build()));
        return Map.of("id", c.getId(), "titre", interlocuteur(c, l));
    }

    private Conversation trouver(Long id, Lecteur l) {
        Conversation c = conversations.findById(id).orElseThrow(() -> new ResourceNotFoundException("Conversation introuvable"));
        if (!accessible(c, l)) throw new BusinessException("Cette conversation ne vous est pas ouverte");
        return c;
    }
}
