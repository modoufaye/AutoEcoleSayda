package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.Classe;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.ClasseRepository;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.service.SeanceService;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Classes d'élèves (voir {@link Classe}). Administration et secrétariat : toutes les classes et tous
 * les élèves. Moniteur : il voit les classes avec ses seuls élèves, crée les siennes et ne les
 * remplit qu'avec ses élèves ; celles des autres restent en lecture.
 */
@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClasseController {

    private static final Set<RoleUser> GESTION = Set.of(RoleUser.SUPER_ADMIN, RoleUser.ADMIN, RoleUser.SECRETAIRE);

    private final ClasseRepository repo;
    private final EleveRepository eleveRepository;
    private final SeanceService seanceService;

    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> lister(Authentication auth) {
        User u = (User) auth.getPrincipal();
        Set<Long> miens = miens(u);
        Map<Long, List<Long>> membres = eleveRepository.findAll().stream()
                .filter(e -> e.getClasseId() != null && !e.isArchive() && (miens == null || miens.contains(e.getId())))
                .collect(Collectors.groupingBy(Eleve::getClasseId, Collectors.mapping(Eleve::getId, Collectors.toList())));
        return repo.findAllByOrderByCreeLeDesc().stream().map(c -> vue(c, membres.getOrDefault(c.getId(), List.of()), u)).toList();
    }

    /** Corps : { nom, eleveIds } ; les élèves cochés quittent leur ancienne classe. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> creer(@RequestBody Map<String, Object> body, Authentication auth) {
        User u = (User) auth.getPrincipal();
        Classe c = repo.save(Classe.builder().nom(nom(body.get("nom"))).auteurId(u.getId()).auteurNom(u.getNom()).auteurRole(u.getRole()).build());
        return vue(c, remplir(c, ids(body.get("eleveIds")), u), u);
    }

    @PutMapping("/{id}")
    @Transactional
    public Map<String, Object> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        User u = (User) auth.getPrincipal();
        Classe c = modifiable(id, u);
        if (body.containsKey("nom")) c.setNom(nom(body.get("nom")));
        repo.save(c);
        List<Long> membres = body.containsKey("eleveIds") ? remplir(c, ids(body.get("eleveIds")), u) : membres(c, miens(u));
        return vue(c, membres, u);
    }

    /** La classe disparaît ; ses élèves restent, sans classe. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void supprimer(@PathVariable Long id, Authentication auth) {
        Classe c = modifiable(id, (User) auth.getPrincipal());
        eleveRepository.findAll().stream().filter(e -> c.getId().equals(e.getClasseId())).forEach(e -> { e.setClasseId(null); eleveRepository.save(e); });
        repo.delete(c);
    }

    // ── Règles ───────────────────────────────────────────────────────────────

    /** null : tous les élèves (gestion) ; sinon les élèves du moniteur connecté. */
    private Set<Long> miens(User u) {
        if (GESTION.contains(u.getRole())) return null;
        return seanceService.findElevesByMoniteur(u.getEmail()).stream().map(Eleve::getId).collect(Collectors.toSet());
    }

    private Classe modifiable(Long id, User u) {
        Classe c = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Classe introuvable"));
        if (!GESTION.contains(u.getRole()) && !Objects.equals(c.getAuteurId(), u.getId()))
            throw new BusinessException("Seul l'auteur de cette classe ou le bureau peut la modifier");
        return c;
    }

    /** Membres voulus : les cochés entrent (quittant leur ancienne classe), les autres sortent.
        Un moniteur ne touche qu'à ses élèves ; les autres membres de la classe restent. */
    private List<Long> remplir(Classe c, Set<Long> voulus, User u) {
        Set<Long> miens = miens(u);
        if (miens != null && !miens.containsAll(voulus)) throw new BusinessException("Vous ne mettez dans une classe que vos élèves");
        for (Eleve e : eleveRepository.findAll()) {
            if (miens != null && !miens.contains(e.getId())) continue;
            boolean dedans = c.getId().equals(e.getClasseId()), voulu = voulus.contains(e.getId());
            if (voulu && !dedans) { e.setClasseId(c.getId()); eleveRepository.save(e); }
            if (!voulu && dedans) { e.setClasseId(null); eleveRepository.save(e); }
        }
        return membres(c, miens);
    }

    private List<Long> membres(Classe c, Set<Long> miens) {
        return eleveRepository.findAll().stream()
                .filter(e -> c.getId().equals(e.getClasseId()) && !e.isArchive() && (miens == null || miens.contains(e.getId())))
                .map(Eleve::getId).toList();
    }

    private Map<String, Object> vue(Classe c, List<Long> membres, User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId()); m.put("nom", c.getNom()); m.put("creeLe", c.getCreeLe());
        m.put("auteur", c.getAuteurNom() == null ? "" : c.getAuteurNom());
        m.put("eleveIds", membres); m.put("nombre", membres.size());
        m.put("modifiable", GESTION.contains(u.getRole()) || Objects.equals(c.getAuteurId(), u.getId()));
        return m;
    }

    private static String nom(Object o) {
        String s = o == null ? "" : o.toString().trim();
        if (s.isEmpty()) throw new BusinessException("Donnez un nom à la classe");
        if (s.length() > 80) throw new BusinessException("Nom trop long (80 caractères au plus)");
        return s;
    }

    private static Set<Long> ids(Object o) {
        if (!(o instanceof List<?> l)) return Set.of();
        return l.stream().map(x -> Long.valueOf(x.toString())).collect(Collectors.toSet());
    }
}
