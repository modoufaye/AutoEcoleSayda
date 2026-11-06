package sn.autoecole.controller;

import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.Visite;
import sn.autoecole.repository.VisiteRepository;
import sn.autoecole.service.VisiteService;

import java.time.LocalDate;
import java.util.*;

/**
 * Visites du site. Public : POST /api/public/visites, envoyé par l'accueil, la connexion et
 * l'inscription en ligne. Super admin seul (SecurityConfig) : GET /api/journal/visites.
 */
@RestController
@RequiredArgsConstructor
public class VisiteController {

    private static final int TAILLE = 30;

    private final VisiteService service;
    private final VisiteRepository repo;

    /** Corps : { page, provenance } (provenance : adresse de la page d'où vient le visiteur). */
    @PostMapping("/api/public/visites")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void noter(@RequestBody(required = false) Map<String, String> body, HttpServletRequest http) {
        if (body == null) return;
        service.visite(http, body.get("page"), body.get("provenance"));
    }

    /** Page d'entrées, des plus récentes aux plus anciennes, et chiffres du jour et des 7 derniers jours. */
    @GetMapping("/api/journal/visites")
    public Map<String, Object> lister(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(required = false) Visite.Type type,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au,
                                      @RequestParam(required = false) String q) {
        Specification<Visite> spec = (r, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (type != null) p.add(cb.equal(r.get("type"), type));
            if (du != null) p.add(cb.greaterThanOrEqualTo(r.get("date"), du.atStartOfDay()));
            if (au != null) p.add(cb.lessThan(r.get("date"), au.plusDays(1).atStartOfDay()));
            if (q != null && !q.isBlank())
                for (String mot : q.trim().toLowerCase().split("\\s+")) {
                    String m = "%" + mot + "%";
                    p.add(cb.or(cb.like(r.get("ip"), m), cb.like(cb.lower(cb.coalesce(r.get("nom"), "")), m),
                            cb.like(cb.coalesce(r.get("telephone"), ""), m), cb.like(cb.lower(cb.coalesce(r.get("provenance"), "")), m),
                            cb.like(cb.lower(cb.coalesce(r.get("resultat"), "")), m)));
                }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Page<Visite> res = repo.findAll(spec, PageRequest.of(Math.max(page, 0), TAILLE, Sort.by(Sort.Direction.DESC, "date", "id")));
        var aujourdhui = LocalDate.now().atStartOfDay(); var semaine = aujourdhui.minusDays(6);
        Map<String, Object> resume = Map.of(
                "visiteursAujourdhui", repo.adressesDepuis(Visite.Type.VISITE, aujourdhui),
                "visiteursSemaine", repo.adressesDepuis(Visite.Type.VISITE, semaine),
                "inscriptionsSemaine", repo.countByTypeAndDateGreaterThanEqual(Visite.Type.INSCRIPTION, semaine));
        return Map.of("entrees", res.getContent(), "total", res.getTotalElements(), "page", res.getNumber(),
                "pages", res.getTotalPages(), "taille", TAILLE, "resume", resume);
    }
}
