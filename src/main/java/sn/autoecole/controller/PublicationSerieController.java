package sn.autoecole.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.config.JournalInterceptor;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.PublicationSerie;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.entity.ProgressionCode;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.ProgressionCodeRepository;
import sn.autoecole.repository.PublicationSerieRepository;
import sn.autoecole.service.EcoleService;
import sn.autoecole.service.SeanceService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Travaux Dirigés : publication des séries d'examen et des catalogues des annales, en entraînement
 * ou en examen blanc. Le super admin, les administrateurs et les moniteurs (pour leurs élèves)
 * publient ; le secrétariat consulte ; l'élève ne voit dans Travaux Dirigés que ce qui lui est publié.
 * Chaque élève d'une publication vient avec son résultat d'examen blanc à cette série (meilleure
 * note, essais) : le personnel voit qui l'a assimilée.
 */
@RestController
@RequestMapping("/api/publications-series")
@RequiredArgsConstructor
public class PublicationSerieController {

    private static final Set<RoleUser> GESTION = Set.of(RoleUser.SUPER_ADMIN, RoleUser.ADMIN, RoleUser.SECRETAIRE);
    private static final Set<String> MODES = Set.of("ENTRAINEMENT", "EXAMEN");

    private final PublicationSerieRepository repo;
    private final EleveRepository eleveRepository;
    private final SeanceService seanceService;
    private final ProgressionCodeRepository progressionRepository;
    private final EcoleService ecoleService;

    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> lister(Authentication auth) {
        User u = (User) auth.getPrincipal();
        List<PublicationSerie> l = GESTION.contains(u.getRole()) ? repo.findAllByOrderByCreeLeDesc() : repo.findByAuteurOrderByCreeLeDesc(u);
        return l.stream().map(p -> vue(p, u)).toList();
    }

    /** Élève : séries et modes publiés pour lui. */
    @GetMapping("/mes")
    @Transactional(readOnly = true)
    public List<Map<String, String>> mes(Authentication auth) {
        User u = (User) auth.getPrincipal();
        Eleve e = eleveRepository.findFirstByTelephone(u.getEmail()).orElse(null);
        if (e == null) return List.of();
        return repo.findByElevesContaining(e).stream().map(p -> Map.of("serie", p.getSerie(), "mode", p.getMode())).distinct().toList();
    }

    /** Fiche d'un élève (personnel) : séries publiées pour lui, une ligne par série avec ses modes,
        même s'il ne les a pas encore faites ; la plus récemment publiée d'abord. */
    @GetMapping("/eleve/{id}")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> pourEleve(@PathVariable Long id) {
        Eleve e = eleveRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Élève introuvable"));
        Map<String, Map<String, Object>> parSerie = new LinkedHashMap<>();
        repo.findByElevesContaining(e).stream()
                .sorted(Comparator.comparing(PublicationSerie::getCreeLe, Comparator.nullsLast(Comparator.reverseOrder())))
                .forEach(p -> {
                    Map<String, Object> x = parSerie.computeIfAbsent(p.getSerie(), k -> {
                        Map<String, Object> n = new LinkedHashMap<>();
                        n.put("serie", k); n.put("modes", new ArrayList<String>()); n.put("creeLe", p.getCreeLe());
                        return n;
                    });
                    @SuppressWarnings("unchecked") List<String> modes = (List<String>) x.get("modes");
                    if (!modes.contains(p.getMode())) modes.add(p.getMode());
                });
        return new ArrayList<>(parSerie.values());
    }

    /** Corps : { serie, modes: ["ENTRAINEMENT", "EXAMEN"], eleveIds } ; une publication par mode. Déjà
        publiée par le même auteur dans ce mode : les élèves cochés s'ajoutent à cette publication. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public List<Map<String, Object>> publier(@RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest http) {
        User u = (User) auth.getPrincipal();
        String serie = serie(body.get("serie"));
        List<String> modes = body.get("modes") instanceof List<?> l ? l.stream().map(String::valueOf).distinct().toList() : List.of();
        if (modes.isEmpty()) throw new BusinessException("Choisissez entraînement, examen blanc, ou les deux");
        if (!MODES.containsAll(modes)) throw new BusinessException("Mode inconnu");
        List<Eleve> eleves = eleves(body.get("eleveIds"), u);
        List<Map<String, Object>> crees = modes.stream().map(m -> {
            PublicationSerie p = repo.findFirstByAuteurAndSerieAndMode(u, serie, m).orElseGet(() -> PublicationSerie.builder()
                    .serie(serie).mode(m).auteur(u).creeLe(LocalDateTime.now()).build());
            eleves.stream().filter(e -> !p.getEleves().contains(e)).forEach(p.getEleves()::add);
            return vue(repo.save(p), u);
        }).toList();
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, serie + " · " + String.join(" et ", modes) + " · " + eleves.size() + " élève(s)");
        return crees;
    }

    /** Un ou plusieurs élèves ajoutés à plusieurs séries et catalogues d'un coup, dans un mode ou les
        deux. Corps : { series, modes, eleveIds }. N'en retire jamais ; ajoute aux publications du même
        auteur (série + mode) ou les crée. Renvoie { ajouts, publications } (publications changées). */
    @PostMapping("/ajouter")
    @Transactional
    public Map<String, Integer> ajouterAPlusieurs(@RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest http) {
        User u = (User) auth.getPrincipal();
        List<String> series = body.get("series") instanceof List<?> l ? l.stream().map(String::valueOf).distinct().map(PublicationSerieController::serie).toList() : List.of();
        if (series.isEmpty()) throw new BusinessException("Cochez au moins une série");
        List<String> modes = body.get("modes") instanceof List<?> l ? l.stream().map(String::valueOf).distinct().toList() : List.of();
        if (modes.isEmpty()) throw new BusinessException("Choisissez entraînement, examen blanc, ou les deux");
        if (!MODES.containsAll(modes)) throw new BusinessException("Mode inconnu");
        List<Eleve> eleves = eleves(body.get("eleveIds"), u);
        int ajouts = 0, changees = 0;
        for (String serie : series) for (String m : modes) {
            PublicationSerie p = repo.findFirstByAuteurAndSerieAndMode(u, serie, m).orElseGet(() -> PublicationSerie.builder()
                    .serie(serie).mode(m).auteur(u).creeLe(LocalDateTime.now()).build());
            List<Eleve> nouveaux = eleves.stream().filter(e -> !p.getEleves().contains(e)).toList();
            if (nouveaux.isEmpty()) continue;
            p.getEleves().addAll(nouveaux);
            repo.save(p);
            ajouts += nouveaux.size(); changees++;
        }
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, String.join(", ", series) + " · " + String.join(" et ", modes) + " · " + eleves.size() + " élève(s)");
        return Map.of("ajouts", ajouts, "publications", changees);
    }

    /** Corps : { eleveIds } : les élèves qui voient la série. */
    @PutMapping("/{id}")
    @Transactional
    public Map<String, Object> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest http) {
        User u = (User) auth.getPrincipal();
        PublicationSerie p = modifiable(id, u);
        p.getEleves().clear();
        p.getEleves().addAll(eleves(body.get("eleveIds"), u));
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, p.getSerie() + " · " + p.getMode() + " · " + p.getEleves().size() + " élève(s)");
        return vue(repo.save(p), u);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void supprimer(@PathVariable Long id, Authentication auth, HttpServletRequest http) {
        PublicationSerie p = modifiable(id, (User) auth.getPrincipal());
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, p.getSerie() + " · " + p.getMode());
        repo.delete(p);
    }

    private PublicationSerie modifiable(Long id, User u) {
        PublicationSerie p = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Publication introuvable"));
        if (!peutModifier(p, u)) throw new BusinessException("Seul l'auteur de la publication, ou l'administration, peut la modifier");
        return p;
    }

    private static boolean peutModifier(PublicationSerie p, User u) {
        return u.getRole() == RoleUser.SUPER_ADMIN || u.getRole() == RoleUser.ADMIN
                || (p.getAuteur() != null && Objects.equals(p.getAuteur().getId(), u.getId()));
    }

    private static String serie(Object v) {
        String id = v == null ? "" : String.valueOf(v);
        if (!ProgressionCodeController.CHAPITRES.contains(id) || !(id.startsWith("serie-") || id.startsWith("annale-")))
            throw new BusinessException("Choisissez une série");
        return id;
    }

    /** Élèves cochés : au moins un ; un moniteur ne publie que pour ses élèves. */
    private List<Eleve> eleves(Object v, User u) {
        List<Long> ids = v instanceof List<?> l ? l.stream().map(x -> Long.valueOf(String.valueOf(x))).distinct().toList() : List.of();
        if (ids.isEmpty()) throw new BusinessException("Cochez au moins un élève");
        if (u.getRole() == RoleUser.MONITEUR) {
            Set<Long> miens = seanceService.findElevesByMoniteur(u.getEmail()).stream().map(Eleve::getId).collect(Collectors.toSet());
            if (!miens.containsAll(ids)) throw new BusinessException("Vous ne publiez que pour vos élèves");
        }
        return eleveRepository.findAllById(ids);
    }

    private Map<String, Object> vue(PublicationSerie p, User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId()); m.put("serie", p.getSerie()); m.put("mode", p.getMode()); m.put("creeLe", p.getCreeLe());
        m.put("auteur", p.getAuteur() == null ? "" : p.getAuteur().getRole() == RoleUser.SUPER_ADMIN ? ecoleService.nom() : p.getAuteur().getNom());
        Map<Long, ProgressionCode> notes = new HashMap<>();
        progressionRepository.findByChapitre(p.getSerie()).forEach(n -> notes.put(n.getEleveId(), n));
        m.put("eleves", p.getEleves().stream().map(e -> {
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("id", e.getId()); x.put("nom", e.getPrenom() + " " + e.getNom());
            // Homonymes fréquents : le numéro distingue deux élèves de même prénom et nom
            x.put("telephone", e.getTelephone() == null ? "" : e.getTelephone());
            ProgressionCode n = notes.get(e.getId());
            if (n != null) {
                x.put("meilleurScore", n.getMeilleurScore()); x.put("total", n.getTotal());
                x.put("tentatives", n.getTentatives()); x.put("derniereTentative", n.getDerniereTentative());
            }
            return x;
        }).toList());
        m.put("modifiable", peutModifier(p, u));
        return m;
    }
}
