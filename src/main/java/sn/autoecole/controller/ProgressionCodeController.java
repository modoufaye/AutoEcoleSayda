package sn.autoecole.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import sn.autoecole.config.JournalInterceptor;
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
 * Progression de l'élève dans les cours de code et le parcours de conduite (chapitres et quiz du
 * frontend). Sous /api/eleve : réservé aux élèves ; les perfectionnements (conduite seule) n'ont
 * accès qu'aux chapitres « conduite-… ».
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
            "usagers-revision", "environnement-eco", "environnement-respect", "environnement-revision",
            // Parcours « Apprendre à conduire » (contenu/conduite.js), ouvert aussi aux perfectionnements
            "conduite-prise-en-main", "conduite-boite-manuelle", "conduite-manoeuvres-parking", "conduite-manoeuvres-revision",
            "conduite-circulation-urbaine", "conduite-carrefours-ville", "conduite-ville-revision", "conduite-route-nationale",
            "conduite-route-depasser", "conduite-route-revision", "conduite-urgence-controle", "conduite-urgence-panne",
            "conduite-urgence-revision", "conduite-autoroute-circuler", "conduite-autoroute-sortir", "conduite-autoroute-revision",
            "conduite-nuit", "conduite-pluie", "conduite-conditions-revision");
    private static final double SEUIL = 0.7;

    private final EleveRepository eleveRepository;
    private final ProgressionCodeRepository progressionRepository;

    @GetMapping("/api/eleve/code/progression")
    public List<ProgressionCode> maProgression(Authentication auth) {
        Eleve e = eleve(auth);
        return progressionRepository.findByEleveId(e.getId()).stream()
                .filter(p -> !e.estPerfectionnement() || estConduite(p.getChapitre())).toList();
    }

    /** Corps : { chapitre, score, total } ; garde la meilleure note et le nombre de tentatives. */
    @PostMapping("/api/eleve/code/progression")
    public ProgressionCode enregistrer(@RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest http) {
        Eleve e = eleve(auth);
        String chapitre = String.valueOf(body.get("chapitre"));
        int score = ((Number) body.getOrDefault("score", -1)).intValue();
        int total = ((Number) body.getOrDefault("total", 0)).intValue();
        if (!CHAPITRES.contains(chapitre) || total <= 0 || total > 60 || score < 0 || score > total)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Résultat invalide");
        if (e.estPerfectionnement() && !estConduite(chapitre))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cours de code non disponibles en perfectionnement");
        ProgressionCode p = progressionRepository.findByEleveIdAndChapitre(e.getId(), chapitre)
                .orElseGet(() -> ProgressionCode.builder().eleveId(e.getId()).chapitre(chapitre).build());
        if (p.getTentatives() == 0 || score * (double) p.getTotal() >= p.getMeilleurScore() * (double) total) {
            p.setMeilleurScore(score);
            p.setTotal(total);
        }
        p.setReussi(p.isReussi() || score >= Math.ceil(SEUIL * total));
        p.setTentatives(p.getTentatives() + 1);
        p.setDerniereTentative(LocalDateTime.now());
        ProgressionCode saved = progressionRepository.save(p);
        // Journal : la note de cet essai, en plus de la meilleure
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, "chapitre « " + chapitre.replace('-', ' ') + " » · " + score + "/" + total
                + (saved.getMeilleurScore() * total != score * saved.getTotal() ? " (meilleure note " + saved.getMeilleurScore() + "/" + saved.getTotal() + ")" : "")
                + (saved.isReussi() ? " · validé" : ""));
        return saved;
    }

    @GetMapping("/api/eleves/{id}/progression-code")
    public List<ProgressionCode> progressionEleve(@PathVariable Long id) {
        return progressionRepository.findByEleveId(id);
    }

    private Eleve eleve(Authentication auth) {
        return eleveRepository.findFirstByTelephone(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));
    }

    /** Chapitre du parcours de conduite : seul accessible aux élèves en perfectionnement. */
    private static boolean estConduite(String chapitre) {
        return chapitre != null && chapitre.startsWith("conduite-");
    }
}
