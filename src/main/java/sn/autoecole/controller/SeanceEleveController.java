package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.config.JournalInterceptor;
import sn.autoecole.dto.SeanceResponse;
import sn.autoecole.entity.ResultatQuizSeance;
import sn.autoecole.service.SeanceService;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eleve/seances")
@RequiredArgsConstructor
public class SeanceEleveController {

    private final SeanceService seanceService;

    @GetMapping
    public List<SeanceResponse> list(@AuthenticationPrincipal UserDetails user) {
        return seanceService.findPublishedForEleve(user.getUsername());
    }

    /** Mes résultats aux quiz des séances de code. */
    @GetMapping("/resultats")
    public List<ResultatQuizSeance> mesResultats(@AuthenticationPrincipal UserDetails user) {
        return seanceService.mesResultats(user.getUsername());
    }

    /** Corps : { score, total, erreurs: ["question → bonne réponse", …] }. */
    @PostMapping("/{id}/quiz")
    public ResultatQuizSeance quiz(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                   @AuthenticationPrincipal UserDetails user, HttpServletRequest http) {
        int score = body.get("score") instanceof Number n ? n.intValue() : -1;
        int total = body.get("total") instanceof Number n ? n.intValue() : 0;
        List<String> erreurs = body.get("erreurs") instanceof List<?> l ? l.stream().map(String::valueOf).toList() : List.of();
        ResultatQuizSeance r = seanceService.enregistrerQuiz(id, user.getUsername(), score, total, erreurs);
        SeanceResponse s = seanceService.findByIdForEleve(id, user.getUsername());
        http.setAttribute(JournalInterceptor.CIBLE_PRECISE, "« " + s.titre() + " » · " + score + "/" + total
                + (r.isReussi() ? " · validé" : " · à revoir"));
        return r;
    }

    @GetMapping("/{id}")
    public SeanceResponse get(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return seanceService.findByIdForEleve(id, user.getUsername());
    }
}
