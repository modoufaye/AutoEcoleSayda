package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.Cours;
import sn.autoecole.enums.CategoriePanneau;
import sn.autoecole.enums.Langue;
import sn.autoecole.enums.TypeContenu;
import sn.autoecole.repository.CoursRepository;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cours")
@RequiredArgsConstructor
public class CoursController {

    private final CoursRepository coursRepository;
    private final MoniteurRepository moniteurRepository;
    private final EleveRepository eleveRepository;

    /* Cours de code : visibles par l'admin et par les moniteurs à qui l'admin a ouvert l'accès.
       Fermés aux élèves et aux autres moniteurs (contrôlé ici, pas seulement en masquant le menu). */
    private boolean aAcces(Authentication auth) {
        if (auth == null) return false;
        if (aRole(auth, "ROLE_SUPER_ADMIN")) return true;
        if (!aRole(auth, "ROLE_MONITEUR")) return false;
        return moniteurRepository.findFirstByTelephone(auth.getName())
                .map(m -> Boolean.TRUE.equals(m.getAccesCoursCode()))
                .orElse(false);
    }

    private static boolean aRole(Authentication auth, String role) {
        return auth.getAuthorities().stream().anyMatch(a -> role.equals(a.getAuthority()));
    }

    private void verifierAcces(Authentication auth) {
        if (!aAcces(auth)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cours de code non disponibles pour ce compte");
    }

    /** Le menu « Cours Code » n'est affiché que si ce point d'accès répond true. Les élèves en permis
        y ont accès pour les thèmes de code (contenu du frontend, progression via /api/eleve/code) ;
        les cours enregistrés ci-dessous leur restent fermés. */
    @GetMapping("/acces")
    public Map<String, Boolean> acces(Authentication auth) {
        boolean eleve = auth != null && aRole(auth, "ROLE_ELEVE") && eleveRepository.findFirstByTelephone(auth.getName())
                .map(e -> !e.estPerfectionnement()).orElse(false);
        return Map.of("acces", eleve || aAcces(auth));
    }

    @GetMapping
    public List<Cours> getAll(Authentication auth) {
        verifierAcces(auth);
        return coursRepository.findAll();
    }

    @GetMapping("/langue/{langue}")
    public List<Cours> getByLangue(@PathVariable Langue langue, Authentication auth) {
        verifierAcces(auth);
        return coursRepository.findByLangue(langue);
    }

    @GetMapping("/type/{type}")
    public List<Cours> getByType(@PathVariable TypeContenu type, Authentication auth) {
        verifierAcces(auth);
        return coursRepository.findByTypeContenu(type);
    }

    @GetMapping("/categorie/{categorie}")
    public List<Cours> getByCategorie(@PathVariable CategoriePanneau categorie, Authentication auth) {
        verifierAcces(auth);
        return coursRepository.findByCategorie(categorie);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cours> getById(@PathVariable Long id, Authentication auth) {
        verifierAcces(auth);
        return coursRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Cours> create(@RequestBody Map<String, String> body, Authentication auth) {
        verifierAcces(auth);
        String titre = body.get("titre");
        if (titre == null || titre.isBlank())
            return ResponseEntity.badRequest().build();
        Cours cours = Cours.builder()
                .titre(titre.trim())
                .description(body.get("description"))
                .contenu(body.get("contenu"))
                .imageUrl(body.get("imageUrl"))
                .typeContenu(TypeContenu.valueOf(body.getOrDefault("typeContenu", "IMAGE")))
                .langue(Langue.valueOf(body.getOrDefault("langue", "FRANCAIS")))
                .categorie(body.get("categorie") != null ? CategoriePanneau.valueOf(body.get("categorie")) : null)
                .build();
        return ResponseEntity.ok(coursRepository.save(cours));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cours> update(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        verifierAcces(auth);
        return coursRepository.findById(id).map(cours -> {
            if (body.containsKey("titre")       && body.get("titre") != null) cours.setTitre(body.get("titre").trim());
            if (body.containsKey("description")) cours.setDescription(body.get("description"));
            if (body.containsKey("contenu"))     cours.setContenu(body.get("contenu"));
            if (body.containsKey("imageUrl"))    cours.setImageUrl(body.get("imageUrl"));
            if (body.containsKey("langue"))      cours.setLangue(Langue.valueOf(body.get("langue")));
            if (body.containsKey("categorie") && body.get("categorie") != null)
                cours.setCategorie(CategoriePanneau.valueOf(body.get("categorie")));
            return ResponseEntity.ok(coursRepository.save(cours));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        verifierAcces(auth);
        if (!coursRepository.existsById(id)) return ResponseEntity.notFound().build();
        coursRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
