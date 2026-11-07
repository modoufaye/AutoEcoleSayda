package sn.autoecole.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.config.JournalInterceptor;
import sn.autoecole.entity.Media;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.BlocContenuRepository;
import sn.autoecole.repository.MediaRepository;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Médiathèque : vidéos et audios en français ou en wolof. Personnel (super admin, administrateurs,
 * moniteurs) : /api/medias, tout voir, déposer, modifier ou supprimer les siens (l'administration :
 * tous). Élèves : /api/eleve/medias, les médias rendus visibles. Le fichier passe d'abord par
 * /api/moniteur/upload/video ou /audio. Les médias se choisissent ensuite dans les blocs vidéo et
 * audio des séances ; un média utilisé dans une séance ne peut pas être supprimé.
 */
@RestController
@RequiredArgsConstructor
public class MediaController {

    private final MediaRepository repo;
    private final BlocContenuRepository blocs;

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/api/medias")
    public List<Map<String, Object>> lister(Authentication auth) {
        User moi = (User) auth.getPrincipal();
        return repo.findAllByOrderByCreeLeDesc().stream().map(m -> {
            Map<String, Object> v = vue(m, modifiable(m, moi));
            v.put("seances", blocs.seancesUtilisant(m.getUrl()));
            return v;
        }).toList();
    }

    @GetMapping("/api/eleve/medias")
    public List<Map<String, Object>> pourEleves() {
        return repo.findByVisibleElevesTrueOrderByCreeLeDesc().stream().map(m -> vue(m, false)).toList();
    }

    /** Corps : { type, langue, titre, description, url, visibleEleves }. */
    @PostMapping("/api/medias")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> ajouter(@RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest http) {
        User moi = (User) auth.getPrincipal();
        Media.Type type = enumere(Media.Type.class, body.get("type"), "Type de média inconnu");
        String url = String.valueOf(body.get("url"));
        String dossier = type == Media.Type.VIDEO ? "videos" : "audios";
        if (!url.matches("/uploads/" + dossier + "/[A-Za-z0-9._-]{1,200}")) throw new BusinessException("Envoyez d'abord le fichier");
        Media m = Media.builder().type(type).url(url).auteurId(moi.getId()).auteurNom(moi.getNom()).creeLe(LocalDateTime.now()).build();
        remplir(m, body);
        repo.save(m);
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, libelle(m));
        return vue(m, true);
    }

    /** Corps : { langue, titre, description, visibleEleves } (le fichier ne change pas). */
    @PutMapping("/api/medias/{id}")
    public Map<String, Object> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest http) {
        Media m = trouverModifiable(id, auth);
        remplir(m, body);
        repo.save(m);
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, libelle(m));
        return vue(m, true);
    }

    @DeleteMapping("/api/medias/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id, Authentication auth, HttpServletRequest http) {
        Media m = trouverModifiable(id, auth);
        long n = blocs.seancesUtilisant(m.getUrl());
        if (n > 0) throw new BusinessException("Ce média est utilisé dans " + n + " séance" + (n > 1 ? "s" : "")
                + " : retirez-le d'abord de " + (n > 1 ? "ces séances" : "cette séance") + ", puis supprimez-le");
        repo.delete(m);
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, libelle(m));
        // Le fichier n'est utilisé que par ce média : on libère la place
        try { Files.deleteIfExists(Paths.get(uploadDir, m.getUrl().substring("/uploads/".length()))); } catch (Exception ignore) { /* fichier déjà absent */ }
    }

    private Media trouverModifiable(Long id, Authentication auth) {
        Media m = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Média introuvable"));
        if (!modifiable(m, (User) auth.getPrincipal()))
            throw new BusinessException("Seule la personne qui a déposé ce média, ou l'administration, peut le modifier ou le supprimer");
        return m;
    }

    private static boolean modifiable(Media m, User moi) {
        return moi.getRole() == RoleUser.SUPER_ADMIN || moi.getRole() == RoleUser.ADMIN || moi.getId().equals(m.getAuteurId());
    }

    private static void remplir(Media m, Map<String, Object> body) {
        m.setLangue(enumere(Media.Langue.class, body.get("langue"), "Choisissez la langue : français ou wolof"));
        String titre = body.get("titre") == null ? "" : body.get("titre").toString().trim();
        if (titre.isEmpty()) throw new BusinessException("Donnez un titre");
        m.setTitre(titre.length() > 150 ? titre.substring(0, 150) : titre);
        String d = body.get("description") == null ? "" : body.get("description").toString().trim();
        m.setDescription(d.isEmpty() ? null : d.length() > 500 ? d.substring(0, 500) : d);
        m.setVisibleEleves(Boolean.TRUE.equals(body.get("visibleEleves")));
    }

    private static <E extends Enum<E>> E enumere(Class<E> c, Object v, String erreur) {
        try { return Enum.valueOf(c, String.valueOf(v)); } catch (IllegalArgumentException e) { throw new BusinessException(erreur); }
    }

    private static String libelle(Media m) {
        return (m.getType() == Media.Type.VIDEO ? "Vidéo" : "Audio") + " en " + (m.getLangue() == Media.Langue.WOLOF ? "wolof" : "français") + " · « " + m.getTitre() + " »";
    }

    private static Map<String, Object> vue(Media m, boolean modifiable) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", m.getId()); v.put("type", m.getType()); v.put("langue", m.getLangue());
        v.put("titre", m.getTitre()); v.put("description", m.getDescription()); v.put("url", m.getUrl());
        v.put("visibleEleves", m.isVisibleEleves()); v.put("auteurNom", m.getAuteurNom()); v.put("creeLe", m.getCreeLe());
        v.put("modifiable", modifiable);
        return v;
    }
}
