package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sn.autoecole.entity.DiscussionEquipe;
import sn.autoecole.entity.MessageEquipe;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.DiscussionEquipeRepository;
import sn.autoecole.repository.MessageEquipeRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.service.DiscussionEquipeService;
import sn.autoecole.service.EcoleService;
import sn.autoecole.service.VocalService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Discussions privées moniteur ↔ auto-école (boîte partagée : super admin, administrateurs,
 * secrétariat). Le moniteur ne voit que la sienne ; l'auto-école les voit toutes. Mêmes réponses
 * que /api/conversations (liste, messages, vocaux, modification), type « EQUIPE ».
 */
@RestController
@RequestMapping("/api/discussions-equipe")
@RequiredArgsConstructor
public class DiscussionEquipeController {

    private static final long VOCAL_MAX_OCTETS = 15L * 1024 * 1024;

    private final DiscussionEquipeRepository discussions;
    private final MessageEquipeRepository messages;
    private final MoniteurRepository moniteurRepository;
    private final DiscussionEquipeService service;
    private final EcoleService ecoleService;
    private final VocalService vocalService;

    private static User user(Authentication auth) { return (User) auth.getPrincipal(); }

    private String nomMoniteur(Long id) {
        return moniteurRepository.findById(id).map(m -> m.getPrenom() + " " + m.getNom()).orElse("Moniteur");
    }

    /** Pour l'auto-école : « Moniteur · Prénom Nom » ; pour le moniteur : le nom de l'auto-école. */
    private String interlocuteur(DiscussionEquipe d, User u) {
        return service.estEcole(u) ? "Moniteur · " + nomMoniteur(d.getMoniteurId()) : ecoleService.nom();
    }

    private String auteurNom(User u) {
        return u.getRole() == RoleUser.SUPER_ADMIN ? ecoleService.nom() : u.getNom();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> lister(Authentication auth) {
        User u = user(auth);
        MessageEquipe.Cote moi = service.cote(u);
        return service.mesDiscussions(u).stream()
                .filter(d -> d.getDernierMessageLe() != null)
                .sorted(Comparator.comparing(DiscussionEquipe::getDernierMessageLe).reversed())
                .map(d -> {
                    Map<String, Object> v = new LinkedHashMap<>();
                    v.put("id", d.getId()); v.put("type", "EQUIPE"); v.put("moniteurId", d.getMoniteurId());
                    v.put("titre", interlocuteur(d, u));
                    v.put("telephone", service.estEcole(u) ? moniteurRepository.findById(d.getMoniteurId()).map(Moniteur::getTelephone).orElse(null) : null);
                    v.put("dernierLe", d.getDernierMessageLe());
                    messages.findFirstByDiscussionIdOrderByEnvoyeLeDescIdDesc(d.getId()).ifPresent(m ->
                            v.put("apercu", (m.getCote() == moi ? "Vous : " : "") + (m.getAudio() != null ? "🎤 Message vocal"
                                    : m.getTexte().length() > 80 ? m.getTexte().substring(0, 80) + "…" : m.getTexte())));
                    v.put("nonLus", service.nonLus(d, u));
                    return v;
                }).toList();
    }

    @GetMapping("/non-lus")
    public Map<String, Long> totalNonLus(Authentication auth) {
        return Map.of("nombre", service.totalNonLus(user(auth)));
    }

    /** Auto-école : les moniteurs actifs à qui écrire. */
    @GetMapping("/moniteurs")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> moniteurs(Authentication auth) {
        if (!service.estEcole(user(auth))) throw new BusinessException("Réservé à l'auto-école");
        return moniteurRepository.findByActifTrue().stream()
                .sorted(Comparator.comparing((Moniteur m) -> (m.getPrenom() + " " + m.getNom()).toLowerCase()))
                .map(m -> {
                    Map<String, Object> v = new LinkedHashMap<>();
                    v.put("id", m.getId()); v.put("nom", m.getPrenom() + " " + m.getNom()); v.put("telephone", m.getTelephone());
                    return v;
                }).toList();
    }

    /** Ouvre (ou retrouve) la discussion. Moniteur : la sienne ; auto-école : { moniteurId }. */
    @PostMapping
    @Transactional
    public Map<String, Object> ouvrir(@RequestBody(required = false) Map<String, String> body, Authentication auth) {
        User u = user(auth);
        Long moniteurId;
        if (service.estEcole(u)) {
            try { moniteurId = Long.valueOf(String.valueOf(body == null ? null : body.get("moniteurId"))); }
            catch (NumberFormatException e) { throw new BusinessException("Choisissez le moniteur"); }
            if (moniteurRepository.findById(moniteurId).isEmpty()) throw new ResourceNotFoundException("Moniteur introuvable");
        } else {
            Moniteur m = service.moniteur(u);
            if (m == null) throw new BusinessException("Fiche moniteur introuvable pour ce compte");
            moniteurId = m.getId();
        }
        Long mid = moniteurId;
        DiscussionEquipe d = discussions.findFirstByMoniteurId(mid)
                .orElseGet(() -> discussions.save(DiscussionEquipe.builder().moniteurId(mid).creeLe(LocalDateTime.now()).build()));
        return Map.of("id", d.getId(), "titre", interlocuteur(d, u));
    }

    /** Messages de la discussion ; la lire marque les messages reçus comme lus (de son côté). */
    @GetMapping("/{id}/messages")
    @Transactional
    public Map<String, Object> lire(@PathVariable Long id, Authentication auth) {
        User u = user(auth);
        DiscussionEquipe d = trouver(id, u);
        boolean ecole = service.estEcole(u);
        if (ecole) d.setEcoleLuLe(LocalDateTime.now()); else d.setMoniteurLuLe(LocalDateTime.now());
        discussions.save(d);
        MessageEquipe.Cote moi = service.cote(u);
        String moniteur = nomMoniteur(d.getMoniteurId());
        List<Map<String, Object>> liste = messages.findByDiscussionIdOrderByEnvoyeLeAscIdAsc(d.getId()).stream().map(m -> {
            Map<String, Object> v = new LinkedHashMap<>();
            v.put("id", m.getId()); v.put("texte", m.getTexte()); v.put("envoyeLe", m.getEnvoyeLe());
            v.put("deMoi", m.getCote() == moi);
            if (m.getAudio() != null) { v.put("audio", true); v.put("audioDuree", m.getAudioDuree()); }
            if (m.getModifieLe() != null) v.put("modifieLe", m.getModifieLe());
            v.put("modifiable", m.getAudio() == null && u.getId().equals(m.getAuteurId()));
            v.put("auteur", m.getCote() == MessageEquipe.Cote.MONITEUR ? moniteur : m.getAuteurNom());
            return v;
        }).toList();
        return Map.of("id", d.getId(), "titre", interlocuteur(d, u), "messages", liste);
    }

    /** Corps : { texte }. */
    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> envoyer(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        User u = user(auth);
        DiscussionEquipe d = trouver(id, u);
        String texte = texteValide(body);
        return Map.of("id", ajouter(d, u, texte, null, null).getId());
    }

    /** Corps : { texte }. Seul l'auteur modifie son message écrit. */
    @PutMapping("/{id}/messages/{messageId}")
    @Transactional
    public Map<String, Object> modifier(@PathVariable Long id, @PathVariable Long messageId,
                                        @RequestBody Map<String, String> body, Authentication auth) {
        User u = user(auth);
        DiscussionEquipe d = trouver(id, u);
        MessageEquipe m = messages.findById(messageId).filter(x -> x.getDiscussionId().equals(d.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Message introuvable"));
        if (!u.getId().equals(m.getAuteurId())) throw new BusinessException("Vous ne pouvez modifier que vos propres messages");
        if (m.getAudio() != null) throw new BusinessException("Un message vocal ne peut pas être modifié");
        String texte = texteValide(body);
        if (!texte.equals(m.getTexte())) { m.setTexte(texte); m.setModifieLe(LocalDateTime.now()); messages.save(m); }
        return Map.of("id", m.getId());
    }

    @PostMapping(value = "/{id}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> envoyerAudio(@PathVariable Long id, @RequestParam("file") MultipartFile file,
                                            @RequestParam(value = "duree", required = false) Integer duree, Authentication auth) throws IOException {
        User u = user(auth);
        DiscussionEquipe d = trouver(id, u);
        String nom = vocalService.enregistrer(file, VocalService.MESSAGES, VOCAL_MAX_OCTETS);
        return Map.of("id", ajouter(d, u, "", nom, duree == null ? null : Math.max(0, Math.min(duree, 3600))).getId());
    }

    @GetMapping("/{id}/messages/{messageId}/audio")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> ecouter(@PathVariable Long id, @PathVariable Long messageId, Authentication auth) {
        DiscussionEquipe d = trouver(id, user(auth));
        MessageEquipe m = messages.findById(messageId).filter(x -> x.getDiscussionId().equals(d.getId()) && x.getAudio() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Message vocal introuvable"));
        return vocalService.lire(VocalService.MESSAGES, m.getAudio());
    }

    private static String texteValide(Map<String, String> body) {
        String texte = body.get("texte") == null ? "" : body.get("texte").trim();
        if (texte.isEmpty()) throw new BusinessException("Écrivez votre message");
        if (texte.length() > 2000) throw new BusinessException("Message trop long (2 000 caractères au plus)");
        return texte;
    }

    private MessageEquipe ajouter(DiscussionEquipe d, User u, String texte, String audio, Integer duree) {
        LocalDateTime maintenant = LocalDateTime.now();
        MessageEquipe m = messages.save(MessageEquipe.builder().discussionId(d.getId()).cote(service.cote(u)).auteurId(u.getId())
                .auteurNom(auteurNom(u)).texte(texte).audio(audio).audioDuree(duree).envoyeLe(maintenant).build());
        d.setDernierMessageLe(maintenant);
        if (service.estEcole(u)) d.setEcoleLuLe(maintenant); else d.setMoniteurLuLe(maintenant);
        discussions.save(d);
        return m;
    }

    private DiscussionEquipe trouver(Long id, User u) {
        DiscussionEquipe d = discussions.findById(id).orElseThrow(() -> new ResourceNotFoundException("Discussion introuvable"));
        if (!service.accessible(d, u)) throw new BusinessException("Cette discussion ne vous est pas ouverte");
        return d;
    }
}
