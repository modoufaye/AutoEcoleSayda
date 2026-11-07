package sn.autoecole.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.config.JournalInterceptor;
import sn.autoecole.entity.AudioWolof;
import sn.autoecole.entity.User;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.AudioWolofRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Explications en wolof des chapitres et de chacun de leurs panneaux (clé « danger » ou
 * « danger:A1a »). Lecture : tout compte connecté (élèves compris).
 * Dépôt et suppression : super admin, administrateurs et moniteurs (SecurityConfig).
 */
@RestController
@RequestMapping("/api/audios-wolof")
@RequiredArgsConstructor
public class AudioWolofController {

    private final AudioWolofRepository repo;

    /** [{ chapitre, url }] : un audio par chapitre enregistré. */
    @GetMapping
    public List<Map<String, String>> lister() {
        return repo.findAll().stream().map(a -> Map.of("chapitre", a.getChapitre(), "url", a.getUrl())).toList();
    }

    /** Corps : { chapitre, url (renvoyée par /api/moniteur/upload/audio), titre (pour le journal) }. */
    @PutMapping
    @Transactional
    public Map<String, String> deposer(@RequestBody Map<String, String> body, Authentication auth, HttpServletRequest http) {
        String chapitre = chapitre(body.get("chapitre"));
        String url = body.get("url");
        if (url == null || !url.matches("/uploads/audios/[A-Za-z0-9._-]{1,200}"))
            throw new BusinessException("Envoyez d'abord le fichier audio");
        AudioWolof a = repo.findByChapitre(chapitre).orElseGet(() -> AudioWolof.builder().chapitre(chapitre).build());
        a.setUrl(url);
        a.setParNom(auth.getPrincipal() instanceof User u ? u.getNom() : auth.getName());
        a.setMajLe(LocalDateTime.now());
        repo.save(a);
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, titre(body.get("titre"), chapitre));
        return Map.of("chapitre", chapitre, "url", url);
    }

    @DeleteMapping
    @Transactional
    public void supprimer(@RequestParam String chapitre, @RequestParam(required = false) String titre, HttpServletRequest http) {
        repo.findByChapitre(chapitre(chapitre)).ifPresent(repo::delete);
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, titre(titre, chapitre));
    }

    /** Chapitre du cours de code ou de la conduite (pas une série d'examen), ou « chapitre:panneau ». */
    private static String chapitre(String c) {
        String ch = c == null ? null : c.split(":", 2)[0];
        if (ch == null || !ProgressionCodeController.CHAPITRES.contains(ch) || ch.startsWith("serie-")
                || (c.contains(":") && !c.substring(ch.length() + 1).matches("[A-Za-z0-9_.-]{1,40}")))
            throw new BusinessException("Chapitre inconnu");
        return c;
    }

    private static String titre(String titre, String chapitre) {
        return titre == null || titre.isBlank() ? chapitre : titre.length() > 120 ? titre.substring(0, 120) : titre;
    }
}
