package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.QuizEnCours;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.QuizEnCoursRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Quiz en cours de l'élève connecté, gardé sur le serveur pour qu'il reprenne la même partie
 * quel que soit l'appareil (le site en garde aussi une copie sur l'appareil, sauvegardeQuiz.js).
 * Enregistré à chaque réponse, effacé à la fin du quiz ou quand l'élève le redémarre.
 */
@RestController
@RequestMapping("/api/eleve/quiz-en-cours")
@RequiredArgsConstructor
public class QuizEnCoursController {

    private static final Pattern CLE = Pattern.compile("[a-z0-9:_-]{1,80}");
    private static final int TAILLE_MAX = 300_000;

    private final EleveRepository eleveRepository;
    private final QuizEnCoursRepository repository;

    /** Tous les quiz en cours de l'élève : [{ cle, etat, majLe }]. */
    @GetMapping
    public List<Map<String, Object>> lister(Authentication auth) {
        return repository.findByEleveId(eleve(auth).getId()).stream()
                .map(q -> Map.<String, Object>of("cle", q.getCle(), "etat", q.getEtat(), "majLe", q.getMajLe()))
                .toList();
    }

    /** Corps : { etat: "<JSON>" }. */
    @PutMapping("/{cle}")
    @Transactional
    public Map<String, Object> enregistrer(@PathVariable String cle, @RequestBody Map<String, String> body, Authentication auth) {
        verifier(cle);
        String etat = body.get("etat");
        if (etat == null || etat.isBlank() || etat.length() > TAILLE_MAX)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz invalide");
        Long id = eleve(auth).getId();
        QuizEnCours q = repository.findByEleveIdAndCle(id, cle)
                .orElseGet(() -> QuizEnCours.builder().eleveId(id).cle(cle).build());
        q.setEtat(etat);
        q.setMajLe(LocalDateTime.now());
        repository.save(q);
        return Map.of("cle", cle, "majLe", q.getMajLe());
    }

    @DeleteMapping("/{cle}")
    @Transactional
    public void effacer(@PathVariable String cle, Authentication auth) {
        verifier(cle);
        repository.findByEleveIdAndCle(eleve(auth).getId(), cle).ifPresent(repository::delete);
    }

    private static void verifier(String cle) {
        if (!CLE.matcher(cle).matches()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz inconnu");
    }

    private Eleve eleve(Authentication auth) {
        return eleveRepository.findFirstByTelephone(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));
    }
}
