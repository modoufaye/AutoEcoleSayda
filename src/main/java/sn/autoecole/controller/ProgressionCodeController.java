package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.ProgressionCode;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.ProgressionCodeRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Progression de l'élève dans les cours de code (chapitres et quiz du frontend). Sous /api/eleve :
 * réservé aux élèves ; les perfectionnements (conduite seule) n'y ont pas accès.
 * L'admin et le secrétariat lisent celle d'un élève via /api/eleves/{id}/progression-code.
 */
@RestController
@RequiredArgsConstructor
public class ProgressionCodeController {

    /** Chapitres connus (contenu/signalisation.js, priorite.js, reglesConduite.js) : rien d'autre n'est enregistré. */
    private static final Set<String> CHAPITRES = Set.of(
            "danger", "obligation-interdiction", "indication", "lignes", "rive", "zones", "revision",
            "priorite-regles", "priorite-feux", "priorite-situations", "priorite-revision",
            "vitesse-limites", "vitesse-distances", "vitesse-revision", "depassement-methode",
            "depassement-interdits", "depassement-revision", "stationnement-regles", "stationnement-lieux",
            "stationnement-revision", "eclairage-feux", "eclairage-conditions", "eclairage-revision",
            "securite-vigilance", "securite-secours", "securite-revision", "vehicule-documents",
            "vehicule-entretien", "vehicule-revision", "usagers-voie", "usagers-vulnerables",
            "usagers-revision", "environnement-eco", "environnement-respect", "environnement-revision");
    private static final double SEUIL = 0.7;

    private final EleveRepository eleveRepository;
    private final ProgressionCodeRepository progressionRepository;

    @GetMapping("/api/eleve/code/progression")
    public List<ProgressionCode> maProgression(Authentication auth) {
        return progressionRepository.findByEleveId(eleve(auth).getId());
    }

    /** Corps : { chapitre, score, total } ; garde la meilleure note et le nombre de tentatives. */
    @PostMapping("/api/eleve/code/progression")
    public ProgressionCode enregistrer(@RequestBody Map<String, Object> body, Authentication auth) {
        Eleve e = eleve(auth);
        String chapitre = String.valueOf(body.get("chapitre"));
        int score = ((Number) body.getOrDefault("score", -1)).intValue();
        int total = ((Number) body.getOrDefault("total", 0)).intValue();
        if (!CHAPITRES.contains(chapitre) || total <= 0 || total > 60 || score < 0 || score > total)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Résultat invalide");
        ProgressionCode p = progressionRepository.findByEleveIdAndChapitre(e.getId(), chapitre)
                .orElseGet(() -> ProgressionCode.builder().eleveId(e.getId()).chapitre(chapitre).build());
        if (p.getTentatives() == 0 || score * (double) p.getTotal() >= p.getMeilleurScore() * (double) total) {
            p.setMeilleurScore(score);
            p.setTotal(total);
        }
        p.setReussi(p.isReussi() || score >= Math.ceil(SEUIL * total));
        p.setTentatives(p.getTentatives() + 1);
        p.setDerniereTentative(LocalDateTime.now());
        return progressionRepository.save(p);
    }

    @GetMapping("/api/eleves/{id}/progression-code")
    public List<ProgressionCode> progressionEleve(@PathVariable Long id) {
        return progressionRepository.findByEleveId(id);
    }

    private Eleve eleve(Authentication auth) {
        Eleve e = eleveRepository.findFirstByTelephone(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));
        if (e.estPerfectionnement())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cours de code non disponibles en perfectionnement");
        return e;
    }
}
