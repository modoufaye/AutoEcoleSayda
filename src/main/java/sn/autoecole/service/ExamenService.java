package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.ExamenRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Examen;
import sn.autoecole.enums.ResultatExamen;
import sn.autoecole.enums.StatutEleve;
import sn.autoecole.enums.TypeExamen;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.ExamenRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamenService {

    private final ExamenRepository examenRepository;
    private final EleveRepository eleveRepository;

    public List<Examen> listerTous() {
        return examenRepository.findAll();
    }

    public Examen trouverParId(Long id) {
        return examenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Examen", id));
    }

    public List<Examen> listerParEleve(Long eleveId) {
        return examenRepository.findByEleveId(eleveId);
    }

    public List<Examen> listerParPeriode(LocalDate debut, LocalDate fin) {
        return examenRepository.findByDateBetween(debut, fin);
    }

    public List<Examen> listerParResultat(ResultatExamen resultat) {
        return examenRepository.findByResultat(resultat);
    }

    public Examen creer(ExamenRequest request) {
        Eleve eleve = eleveRepository.findById(request.getEleveId())
                .orElseThrow(() -> new ResourceNotFoundException("Élève", request.getEleveId()));
        if (eleve.estPerfectionnement()) {
            throw new BusinessException("Élève en perfectionnement : pas d'examen du permis");
        }

        List<Examen> precedents = examenRepository.findByEleveIdAndType(request.getEleveId(), request.getType());
        int tentative = precedents.size() + 1;

        Examen examen = Examen.builder()
                .date(request.getDate())
                .eleve(eleve)
                .type(request.getType())
                .resultat(request.getResultat() != null ? request.getResultat() : ResultatExamen.EN_ATTENTE)
                .score(request.getScore())
                .tentative(tentative)
                .observations(request.getObservations())
                .build();

        examen = examenRepository.save(examen);

        if (request.getResultat() == ResultatExamen.ADMIS && request.getType() == TypeExamen.CONDUITE) {
            eleve.setStatut(StatutEleve.DIPLOME);
            eleveRepository.save(eleve);
        }
        return examen;
    }

    public Examen mettreAJourResultat(Long id, ResultatExamen resultat, Integer score, String observations) {
        Examen examen = trouverParId(id);
        examen.setResultat(resultat);
        examen.setScore(score);
        if (observations != null) {
            examen.setObservations(observations);
        }

        if (resultat == ResultatExamen.ADMIS && examen.getType() == TypeExamen.CONDUITE) {
            Eleve eleve = examen.getEleve();
            eleve.setStatut(StatutEleve.DIPLOME);
            eleveRepository.save(eleve);
        }
        return examenRepository.save(examen);
    }

    public void supprimer(Long id) {
        if (!examenRepository.existsById(id)) {
            throw new ResourceNotFoundException("Examen", id);
        }
        examenRepository.deleteById(id);
    }
}
