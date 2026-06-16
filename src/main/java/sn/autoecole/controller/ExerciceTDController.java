package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.ExerciceTD;
import sn.autoecole.entity.ReponseTD;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.ExerciceTDRepository;
import sn.autoecole.repository.ReponseTDRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ExerciceTDController {

    private final ExerciceTDRepository exerciceRepo;
    private final ReponseTDRepository  reponseRepo;
    private final EleveRepository      eleveRepository;

    // ── Moniteur / Admin ──────────────────────────────────────────────────────

    @GetMapping("/api/moniteur/exercices-td")
    public List<ExerciceTD> listerPourMoniteur() {
        return exerciceRepo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/api/moniteur/exercices-td")
    public ResponseEntity<ExerciceTD> creer(@RequestBody Map<String, String> body) {
        String imageUrl     = body.get("imageUrl");
        String bonneReponse = body.get("bonneReponse");
        if (imageUrl == null || imageUrl.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'image est obligatoire");
        if (bonneReponse == null || !List.of("A", "B", "C").contains(bonneReponse))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La bonne réponse doit être A, B ou C");

        ExerciceTD ex = ExerciceTD.builder()
                .imageUrl(imageUrl)
                .bonneReponse(bonneReponse)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(exerciceRepo.save(ex));
    }

    @DeleteMapping("/api/moniteur/exercices-td/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        ExerciceTD ex = exerciceRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercice introuvable"));
        reponseRepo.deleteByExerciceId(ex.getId());
        exerciceRepo.delete(ex);
        return ResponseEntity.noContent().build();
    }

    // ── Élève ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/eleve/exercices-td")
    public List<ExerciceTD> listerPourEleve() {
        return exerciceRepo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/api/eleve/exercices-td/{id}/repondre")
    public ResponseEntity<Map<String, Object>> repondre(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String reponse = body.get("reponse");
        if (reponse == null || !List.of("A", "B", "C").contains(reponse))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La réponse doit être A, B ou C");

        Eleve eleve = eleveRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));

        ExerciceTD ex = exerciceRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercice introuvable"));

        boolean estCorrecte = ex.getBonneReponse().equals(reponse);

        ReponseTD rep = reponseRepo.findByExerciceIdAndEleveId(id, eleve.getId())
                .orElse(ReponseTD.builder().exercice(ex).eleve(eleve).build());
        rep.setReponse(reponse);
        rep.setEstCorrecte(estCorrecte);
        reponseRepo.save(rep);

        return ResponseEntity.ok(Map.of(
                "estCorrecte", estCorrecte,
                "bonneReponse", ex.getBonneReponse()
        ));
    }

    @GetMapping("/api/eleve/exercices-td/mes-reponses")
    public List<ReponseTD> mesReponses(Authentication auth) {
        Eleve eleve = eleveRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));
        return reponseRepo.findByEleveIdOrderByCreatedAtDesc(eleve.getId());
    }
}
