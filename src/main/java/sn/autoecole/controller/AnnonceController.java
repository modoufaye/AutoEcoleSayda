package sn.autoecole.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.config.JournalInterceptor;
import sn.autoecole.entity.Annonce;
import sn.autoecole.entity.AnnonceLue;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.service.EcoleService;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.AnnonceLueRepository;
import sn.autoecole.repository.AnnonceRepository;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Annonces de l'auto-école. Écriture : super admin, administrateurs, secrétariat et moniteurs (un
 * moniteur écrit à ses élèves ou au personnel). Lecture : chacun voit les annonces qui lui sont
 * adressées (l'administration et le secrétariat voient toutes les annonces) ; « non lues » ne compte
 * que celles qui lui sont adressées.
 */
@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private static final Set<RoleUser> GESTION = Set.of(RoleUser.SUPER_ADMIN, RoleUser.ADMIN, RoleUser.SECRETAIRE);

    private final AnnonceRepository repo;
    private final AnnonceLueRepository lues;
    private final EleveRepository eleveRepository;
    private final MoniteurRepository moniteurRepository;
    private final EcoleService ecoleService;
    private final sn.autoecole.service.BureauService bureauService;

    /** Qui lit : son compte, et sa fiche élève ou moniteur (bureau, moniteur de l'élève). */
    private record Lecteur(User user, Eleve eleve, Moniteur moniteur) {}

    private Lecteur lecteur(Authentication auth) {
        User u = (User) auth.getPrincipal();
        Eleve e = u.getRole() == RoleUser.ELEVE ? eleveRepository.findFirstByTelephone(u.getEmail()).orElse(null) : null;
        Moniteur m = u.getRole() == RoleUser.MONITEUR ? moniteurRepository.findFirstByTelephone(u.getEmail()).orElse(null) : null;
        return new Lecteur(u, e, m);
    }

    /** L'annonce est adressée à ce lecteur (indépendamment de ce que l'administration peut consulter). */
    private static boolean destinataire(Annonce a, Lecteur l) {
        RoleUser r = l.user().getRole();
        return switch (a.getCible()) {
            case TOUS -> true;
            case ELEVES -> r == RoleUser.ELEVE;
            case BUREAU -> l.eleve() != null && l.eleve().getSite() != null && l.eleve().getSite().equals(a.getValeur());
            case MONITEUR -> (l.eleve() != null && l.eleve().getMoniteur() != null && String.valueOf(l.eleve().getMoniteur().getId()).equals(a.getValeur()))
                    || (l.moniteur() != null && String.valueOf(l.moniteur().getId()).equals(a.getValeur()));
            case PERSONNEL -> r != RoleUser.ELEVE;
        };
    }

    private static boolean visible(Annonce a, Lecteur l) {
        return destinataire(a, l) || GESTION.contains(l.user().getRole()) || Objects.equals(a.getAuteurId(), l.user().getId());
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> lister(Authentication auth) {
        Lecteur l = lecteur(auth);
        Set<Long> dejaLues = lues.annoncesLues(l.user().getId());
        return repo.findAllByOrderByCreeLeDesc().stream().filter(a -> visible(a, l)).map(a -> {
            Map<String, Object> v = new LinkedHashMap<>();
            v.put("id", a.getId()); v.put("titre", a.getTitre()); v.put("contenu", a.getContenu());
            v.put("auteur", a.getAuteurRole() == RoleUser.SUPER_ADMIN ? ecoleService.nom() : a.getAuteurNom());
            v.put("date", a.getCreeLe()); v.put("cible", a.getCible()); v.put("valeur", a.getValeur());
            v.put("destinataires", destinataires(a));
            v.put("pourMoi", destinataire(a, l));
            v.put("lue", !destinataire(a, l) || dejaLues.contains(a.getId()) || Objects.equals(a.getAuteurId(), l.user().getId()));
            v.put("supprimable", supprimable(a, l.user()));
            return v;
        }).toList();
    }

    @GetMapping("/non-lues")
    @Transactional(readOnly = true)
    public Map<String, Long> nonLues(Authentication auth) {
        Lecteur l = lecteur(auth);
        Set<Long> dejaLues = lues.annoncesLues(l.user().getId());
        return Map.of("nombre", repo.findAll().stream().filter(a -> destinataire(a, l) && !dejaLues.contains(a.getId())
                && !Objects.equals(a.getAuteurId(), l.user().getId())).count());
    }

    /** Toutes les annonces adressées au lecteur sont marquées lues (ouverture de la page). */
    @PostMapping("/lues")
    @Transactional
    public Map<String, Boolean> toutLu(Authentication auth) {
        Lecteur l = lecteur(auth);
        Set<Long> dejaLues = lues.annoncesLues(l.user().getId());
        LocalDateTime maintenant = LocalDateTime.now();
        repo.findAll().stream().filter(a -> destinataire(a, l) && !dejaLues.contains(a.getId()))
                .forEach(a -> lues.save(AnnonceLue.builder().annonceId(a.getId()).userId(l.user().getId()).luLe(maintenant).build()));
        return Map.of("ok", true);
    }

    /** Corps : { titre, contenu, cible, valeur } ; un moniteur n'écrit qu'à ses élèves ou au personnel. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> publier(@RequestBody Map<String, String> body, Authentication auth, HttpServletRequest http) {
        Lecteur l = lecteur(auth);
        String titre = texte(body.get("titre"), 150, "Donnez un titre à l'annonce");
        String contenu = texte(body.get("contenu"), 2000, "Écrivez le message de l'annonce");
        Annonce.Cible cible;
        try { cible = Annonce.Cible.valueOf(String.valueOf(body.get("cible"))); }
        catch (IllegalArgumentException e) { throw new BusinessException("Choisissez à qui s'adresse l'annonce"); }
        String valeur = null;
        if (l.user().getRole() == RoleUser.MONITEUR) {
            if (cible != Annonce.Cible.MONITEUR && cible != Annonce.Cible.PERSONNEL)
                throw new BusinessException("Un moniteur écrit à ses élèves ou au personnel");
            if (cible == Annonce.Cible.MONITEUR) {
                if (l.moniteur() == null) throw new BusinessException("Fiche moniteur introuvable pour ce compte");
                valeur = String.valueOf(l.moniteur().getId());
            }
        } else if (cible == Annonce.Cible.BUREAU) {
            valeur = String.valueOf(body.get("valeur"));
            if (!bureauService.existe(valeur)) throw new BusinessException("Choisissez le bureau");
        } else if (cible == Annonce.Cible.MONITEUR) {
            Long id;
            try { id = Long.valueOf(String.valueOf(body.get("valeur"))); } catch (NumberFormatException e) { throw new BusinessException("Choisissez le moniteur"); }
            valeur = String.valueOf(moniteurRepository.findById(id).orElseThrow(() -> new BusinessException("Moniteur introuvable")).getId());
        }
        Annonce a = repo.save(Annonce.builder().titre(titre).contenu(contenu).cible(cible).valeur(valeur)
                .auteurId(l.user().getId()).auteurNom(l.user().getNom()).auteurRole(l.user().getRole()).creeLe(LocalDateTime.now()).build());
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, "« " + a.getTitre() + " » · " + destinataires(a));
        return Map.of("id", a.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void supprimer(@PathVariable Long id, Authentication auth, HttpServletRequest http) {
        User u = (User) auth.getPrincipal();
        Annonce a = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Annonce introuvable"));
        if (!supprimable(a, u)) throw new BusinessException("Seul l'auteur de l'annonce, ou l'administration, peut la supprimer");
        lues.supprimerPourAnnonce(a.getId());
        repo.delete(a);
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, "« " + a.getTitre() + " »");
    }

    private static boolean supprimable(Annonce a, User u) {
        return u.getRole() == RoleUser.SUPER_ADMIN || u.getRole() == RoleUser.ADMIN || Objects.equals(a.getAuteurId(), u.getId());
    }

    private String destinataires(Annonce a) {
        return switch (a.getCible()) {
            case TOUS -> "Tout le monde";
            case ELEVES -> "Tous les élèves";
            case BUREAU -> {
                yield bureauService.existe(a.getValeur()) ? "Élèves de " + bureauService.libelle(a.getValeur()) : "Élèves d'un bureau";
            }
            case MONITEUR -> moniteurRepository.findById(Long.valueOf(a.getValeur()))
                    .map(m -> "Élèves de " + m.getPrenom() + " " + m.getNom()).orElse("Élèves d'un moniteur");
            case PERSONNEL -> "Le personnel";
        };
    }

    private static String texte(String v, int max, String erreur) {
        String t = v == null ? "" : v.trim();
        if (t.isEmpty()) throw new BusinessException(erreur);
        return t.length() > max ? t.substring(0, max) : t;
    }
}
