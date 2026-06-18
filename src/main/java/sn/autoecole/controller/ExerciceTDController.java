package sn.autoecole.controller;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.ExerciceTD;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.QuestionTD;
import sn.autoecole.entity.ReponseTD;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.ExerciceTDRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.QuestionTDRepository;
import sn.autoecole.repository.ReponseTDRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ExerciceTDController {

    private final ExerciceTDRepository exerciceRepo;
    private final QuestionTDRepository questionRepo;
    private final ReponseTDRepository  reponseRepo;
    private final EleveRepository      eleveRepository;
    private final MoniteurRepository   moniteurRepository;

    // ── Moniteur / Admin ──────────────────────────────────────────────────────

    @GetMapping("/api/moniteur/exercices-td")
    public List<ExerciceTD> listerPourMoniteur() {
        return exerciceRepo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/api/moniteur/exercices-td")
    public ResponseEntity<ExerciceTD> creer(@RequestBody Map<String, Object> body, Authentication auth) {
        String titre = (String) body.get("titre");
        if (titre == null || titre.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le titre est obligatoire");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questionsData = (List<Map<String, Object>>) body.get("questions");
        if (questionsData == null || questionsData.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Au moins une question est requise");

        Moniteur moniteur = auth != null
                ? moniteurRepository.findByEmailIgnoreCase(auth.getName()).orElse(null)
                : null;

        ExerciceTD exercice = ExerciceTD.builder().titre(titre).moniteur(moniteur).build();
        exercice = exerciceRepo.save(exercice);

        List<QuestionTD> questions = new ArrayList<>();
        for (int i = 0; i < questionsData.size(); i++) {
            Map<String, Object> q = questionsData.get(i);
            String imageUrl     = (String) q.get("imageUrl");
            String bonneReponse = (String) q.get("bonneReponse");
            boolean avecOptionD = Boolean.TRUE.equals(q.get("avecOptionD"));
            boolean avecOptionC = avecOptionD || Boolean.TRUE.equals(q.get("avecOptionC"));

            if (imageUrl == null || imageUrl.isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image manquante à la question " + (i + 1));

            if (avecOptionD) {
                // 4 options → 1 bonne réponse parmi A/B et 1 parmi C/D
                String[] parts = bonneReponse != null ? bonneReponse.split(",") : new String[0];
                if (parts.length != 2)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question " + (i + 1) + " : choisissez 1 réponse parmi A/B et 1 parmi C/D");
                boolean hasAB = Arrays.stream(parts).anyMatch(p -> p.trim().equals("A") || p.trim().equals("B"));
                boolean hasCD = Arrays.stream(parts).anyMatch(p -> p.trim().equals("C") || p.trim().equals("D"));
                if (!hasAB || !hasCD)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question " + (i + 1) + " : 1 bonne réponse parmi A/B et 1 parmi C/D");
                bonneReponse = normaliser(bonneReponse);
            } else {
                List<String> valides = avecOptionC ? List.of("A","B","C") : List.of("A","B");
                if (bonneReponse == null || !valides.contains(bonneReponse))
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bonne réponse invalide à la question " + (i + 1));
            }

            questions.add(QuestionTD.builder()
                    .exercice(exercice)
                    .imageUrl(imageUrl)
                    .avecOptionC(avecOptionC)
                    .avecOptionD(avecOptionD)
                    .bonneReponse(bonneReponse)
                    .ordre(i)
                    .build());
        }
        questionRepo.saveAll(questions);
        return ResponseEntity.status(HttpStatus.CREATED).body(exerciceRepo.findById(exercice.getId()).orElseThrow());
    }

    @PostMapping("/api/moniteur/exercices-td/{id}/questions")
    public ResponseEntity<QuestionTD> ajouterQuestion(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ExerciceTD ex = exerciceRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercice introuvable"));

        String imageUrl     = (String) body.get("imageUrl");
        String bonneReponse = (String) body.get("bonneReponse");
        boolean avecOptionD = Boolean.TRUE.equals(body.get("avecOptionD"));
        boolean avecOptionC = avecOptionD || Boolean.TRUE.equals(body.get("avecOptionC"));
        int ordre = body.get("ordre") instanceof Number n ? n.intValue() : ex.getQuestions().size();

        if (imageUrl == null || imageUrl.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image obligatoire");

        if (avecOptionD) {
            String[] parts = bonneReponse != null ? bonneReponse.split(",") : new String[0];
            if (parts.length != 2)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choisissez 1 réponse parmi A/B et 1 parmi C/D");
            boolean hasAB = Arrays.stream(parts).anyMatch(p -> p.trim().equals("A") || p.trim().equals("B"));
            boolean hasCD = Arrays.stream(parts).anyMatch(p -> p.trim().equals("C") || p.trim().equals("D"));
            if (!hasAB || !hasCD)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choisissez 1 réponse parmi A/B et 1 parmi C/D");
            bonneReponse = normaliser(bonneReponse);
        } else {
            List<String> valides = avecOptionC ? List.of("A","B","C") : List.of("A","B");
            if (bonneReponse == null || !valides.contains(bonneReponse))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bonne réponse invalide");
        }

        QuestionTD q = QuestionTD.builder()
                .exercice(ex)
                .imageUrl(imageUrl)
                .avecOptionC(avecOptionC)
                .avecOptionD(avecOptionD)
                .bonneReponse(bonneReponse)
                .ordre(ordre)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(questionRepo.save(q));
    }

    @PatchMapping("/api/moniteur/exercices-td/{id}")
    public ResponseEntity<ExerciceTD> renommerExercice(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String titre = (String) body.get("titre");
        if (titre == null || titre.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le titre est obligatoire");
        ExerciceTD ex = exerciceRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercice introuvable"));
        ex.setTitre(titre.trim());
        return ResponseEntity.ok(exerciceRepo.save(ex));
    }

    @PutMapping("/api/moniteur/exercices-td/questions/{id}")
    public ResponseEntity<QuestionTD> modifierQuestion(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        QuestionTD q = questionRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question introuvable"));

        boolean avecOptionD = Boolean.TRUE.equals(body.get("avecOptionD"));
        boolean avecOptionC = avecOptionD || Boolean.TRUE.equals(body.get("avecOptionC"));
        String bonneReponse = (String) body.get("bonneReponse");
        String imageUrl     = (String) body.get("imageUrl");

        if (avecOptionD) {
            String[] parts = bonneReponse != null ? bonneReponse.split(",") : new String[0];
            if (parts.length != 2)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choisissez 1 réponse parmi A/B et 1 parmi C/D");
            boolean hasAB = Arrays.stream(parts).anyMatch(p -> p.trim().equals("A") || p.trim().equals("B"));
            boolean hasCD = Arrays.stream(parts).anyMatch(p -> p.trim().equals("C") || p.trim().equals("D"));
            if (!hasAB || !hasCD)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choisissez 1 réponse parmi A/B et 1 parmi C/D");
            bonneReponse = normaliser(bonneReponse);
        } else {
            List<String> valides = avecOptionC ? List.of("A","B","C") : List.of("A","B");
            if (bonneReponse == null || !valides.contains(bonneReponse))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bonne réponse invalide");
        }

        q.setAvecOptionC(avecOptionC);
        q.setAvecOptionD(avecOptionD);
        q.setBonneReponse(bonneReponse);
        if (imageUrl != null && !imageUrl.isBlank()) q.setImageUrl(imageUrl);

        return ResponseEntity.ok(questionRepo.save(q));
    }

    @Transactional
    @DeleteMapping("/api/moniteur/exercices-td/questions/{id}")
    public ResponseEntity<Void> supprimerQuestion(@PathVariable Long id) {
        QuestionTD q = questionRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question introuvable"));
        reponseRepo.deleteByQuestionId(id);
        questionRepo.delete(q);
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @DeleteMapping("/api/moniteur/exercices-td/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        ExerciceTD ex = exerciceRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercice introuvable"));
        reponseRepo.deleteByQuestionExerciceId(ex.getId());
        exerciceRepo.delete(ex);
        return ResponseEntity.noContent().build();
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/admin/exercices-td")
    public List<Map<String, Object>> listerPourAdmin() {
        return buildStatsDto(exerciceRepo.findAllByOrderByCreatedAtDesc());
    }

    // ── Moniteur stats ────────────────────────────────────────────────────────

    @GetMapping("/api/moniteur/exercices-td/stats")
    public List<Map<String, Object>> statsMoniteur() {
        return buildStatsDto(exerciceRepo.findAllByOrderByCreatedAtDesc());
    }

    private List<Map<String, Object>> buildStatsDto(List<ExerciceTD> exercices) {
        return exercices.stream().map(ex -> {
            int total = ex.getQuestions().size();
            List<Eleve> elevesDistincts = reponseRepo.findDistinctElevesByExerciceId(ex.getId());
            Map<String, Object> dto = new java.util.LinkedHashMap<>();
            dto.put("id", ex.getId());
            dto.put("titre", ex.getTitre());
            dto.put("nbQuestions", total);
            dto.put("createdAt", ex.getCreatedAt());
            if (ex.getMoniteur() != null) {
                dto.put("moniteur", Map.of(
                        "id", ex.getMoniteur().getId(),
                        "nom", ex.getMoniteur().getNom(),
                        "prenom", ex.getMoniteur().getPrenom()
                ));
            } else {
                dto.put("moniteur", null);
            }
            dto.put("questions", ex.getQuestions().stream().map(q -> {
                Map<String, Object> qDto = new java.util.LinkedHashMap<>();
                qDto.put("id", q.getId());
                qDto.put("imageUrl", q.getImageUrl());
                qDto.put("bonneReponse", q.getBonneReponse());
                qDto.put("avecOptionC", q.isAvecOptionC());
                qDto.put("avecOptionD", q.isAvecOptionD());
                qDto.put("ordre", q.getOrdre());
                return qDto;
            }).collect(Collectors.toList()));
            dto.put("eleves", elevesDistincts.stream().map(e -> {
                long bonnes = reponseRepo.countBonnesReponses(e.getId(), ex.getId());
                Map<String, Object> eDto = new java.util.LinkedHashMap<>();
                eDto.put("id", e.getId());
                eDto.put("nom", e.getNom());
                eDto.put("prenom", e.getPrenom());
                eDto.put("bonnes", bonnes);
                eDto.put("total", total);
                return eDto;
            }).collect(Collectors.toList()));
            return dto;
        }).collect(Collectors.toList());
    }

    // ── Élève ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/eleve/exercices-td")
    public List<ExerciceTD> listerPourEleve() {
        return exerciceRepo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/api/eleve/exercices-td/questions/{id}/repondre")
    public ResponseEntity<Map<String, Object>> repondre(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String reponse = body.get("reponse");

        Eleve eleve = eleveRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));

        QuestionTD question = questionRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question introuvable"));

        if (question.isAvecOptionD()) {
            String[] parts = reponse != null ? reponse.split(",") : new String[0];
            if (parts.length != 2)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choisissez 1 réponse parmi A/B et 1 parmi C/D");
            boolean hasAB = Arrays.stream(parts).anyMatch(p -> p.trim().equals("A") || p.trim().equals("B"));
            boolean hasCD = Arrays.stream(parts).anyMatch(p -> p.trim().equals("C") || p.trim().equals("D"));
            if (!hasAB || !hasCD)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choisissez 1 réponse parmi A/B et 1 parmi C/D");
            reponse = normaliser(reponse);
        } else {
            List<String> valides = question.isAvecOptionC() ? List.of("A","B","C") : List.of("A","B");
            if (reponse == null || !valides.contains(reponse))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La réponse doit être parmi : " + valides);
        }

        boolean estCorrecte = normaliser(question.getBonneReponse()).equals(normaliser(reponse));

        ReponseTD rep = reponseRepo.findByQuestionIdAndEleveId(id, eleve.getId())
                .orElse(ReponseTD.builder().question(question).eleve(eleve).build());
        rep.setReponse(reponse);
        rep.setEstCorrecte(estCorrecte);
        reponseRepo.save(rep);

        return ResponseEntity.ok(Map.of(
                "estCorrecte", estCorrecte,
                "bonneReponse", question.getBonneReponse()
        ));
    }

    @Transactional
    @DeleteMapping("/api/eleve/exercices-td/{exId}/mes-reponses")
    public ResponseEntity<Void> reinitialiserReponses(@PathVariable Long exId, Authentication auth) {
        Eleve eleve = eleveRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));
        exerciceRepo.findById(exId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercice introuvable"));
        reponseRepo.deleteByQuestionExerciceIdAndEleveId(exId, eleve.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/eleve/exercices-td/mes-reponses")
    public List<ReponseTD> mesReponses(Authentication auth) {
        Eleve eleve = eleveRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil élève introuvable"));
        return reponseRepo.findByEleveIdOrderByCreatedAtDesc(eleve.getId());
    }

    private String normaliser(String reponse) {
        return Arrays.stream(reponse.split(","))
                .map(String::trim)
                .sorted()
                .collect(Collectors.joining(","));
    }
}
