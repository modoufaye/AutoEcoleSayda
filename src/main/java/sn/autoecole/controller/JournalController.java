package sn.autoecole.controller;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.JournalAction;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.JournalActionRepository;

import java.time.LocalDate;
import java.util.*;

/**
 * Lecture du journal des actions (SecurityConfig : super admin et administrateurs).
 * Le super admin voit tout ; un administrateur voit ses propres actions, celles du secrétariat,
 * des moniteurs et des élèves (filtré ici, pas seulement à l'écran).
 */
@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private static final int TAILLE = 30;
    /** Rôles dont un administrateur voit les actions, en plus des siennes. */
    private static final Set<RoleUser> VUS_PAR_ADMIN = Set.of(RoleUser.SECRETAIRE, RoleUser.MONITEUR, RoleUser.ELEVE);

    private final JournalActionRepository journalRepository;

    /** Page d'entrées, des plus récentes aux plus anciennes, avec filtres facultatifs. */
    @GetMapping
    public Map<String, Object> lister(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(required = false) RoleUser role,
                                      @RequestParam(required = false) Long utilisateur,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au,
                                      @RequestParam(required = false) String q,
                                      Authentication auth) {
        User moi = (User) auth.getPrincipal();
        Specification<JournalAction> spec = (r, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (moi.getRole() != RoleUser.SUPER_ADMIN)
                p.add(cb.or(cb.equal(r.get("utilisateurId"), moi.getId()), r.get("role").in(VUS_PAR_ADMIN)));
            if (role != null) p.add(cb.equal(r.get("role"), role));
            if (utilisateur != null) p.add(cb.equal(r.get("utilisateurId"), utilisateur));
            if (du != null) p.add(cb.greaterThanOrEqualTo(r.get("date"), du.atStartOfDay()));
            if (au != null) p.add(cb.lessThan(r.get("date"), au.plusDays(1).atStartOfDay()));
            if (q != null && !q.isBlank())
                for (String mot : q.trim().toLowerCase().split("\\s+")) {
                    String m = "%" + mot + "%";
                    // Un numéro se cherche avec ou sans espaces (« 771234567 » ou « 77 123 45 67 »)
                    p.add(cb.or(cb.like(cb.lower(r.get("action")), m), cb.like(cb.lower(cb.coalesce(r.get("cible"), "")), m),
                            cb.like(cb.function("replace", String.class, cb.coalesce(r.get("cible"), ""), cb.literal(" "), cb.literal("")), m),
                            cb.like(cb.lower(r.get("nom")), m), cb.like(cb.lower(cb.coalesce(r.get("identifiant"), "")), m)));
                }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Page<JournalAction> res = journalRepository.findAll(spec,
                PageRequest.of(Math.max(page, 0), TAILLE, Sort.by(Sort.Direction.DESC, "date", "id")));
        return Map.of("entrees", res.getContent(), "total", res.getTotalElements(), "page", res.getNumber(),
                "pages", res.getTotalPages(), "taille", TAILLE);
    }

    /** Personnes que l'utilisateur peut voir dans le journal, pour le filtre « Personne ». */
    @GetMapping("/personnes")
    public List<Map<String, Object>> personnes(Authentication auth) {
        User moi = (User) auth.getPrincipal();
        Map<Long, Map<String, Object>> parId = new LinkedHashMap<>();
        for (Object[] x : journalRepository.personnes()) {
            Long id = (Long) x[0]; RoleUser role = (RoleUser) x[2];
            // Élèves et moniteurs se connectent avec leur numéro : il distingue les homonymes
            String identifiant = x[3] == null || String.valueOf(x[3]).contains("@") ? "" : String.valueOf(x[3]);
            if (moi.getRole() != RoleUser.SUPER_ADMIN && !Objects.equals(id, moi.getId()) && !VUS_PAR_ADMIN.contains(role)) continue;
            parId.putIfAbsent(id, Map.of("id", id, "nom", x[1], "role", role, "telephone", identifiant));   // dernier nom connu suffit
        }
        return parId.values().stream().sorted(Comparator.comparing(m -> String.valueOf(m.get("nom")))).toList();
    }
}
