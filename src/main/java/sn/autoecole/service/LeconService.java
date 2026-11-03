package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.LeconRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Lecon;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.Vehicule;
import sn.autoecole.enums.StatutLecon;
import sn.autoecole.enums.TypeLecon;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.LeconRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.VehiculeRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LeconService {

    private final LeconRepository leconRepository;
    private final EleveRepository eleveRepository;
    private final MoniteurRepository moniteurRepository;
    private final VehiculeRepository vehiculeRepository;

    public List<Lecon> listerTous() {
        return leconRepository.findAll();
    }

    public Lecon trouverParId(Long id) {
        return leconRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leçon", id));
    }

    public List<Lecon> listerParEleve(Long eleveId) {
        return leconRepository.findByEleveId(eleveId);
    }

    public List<Lecon> listerParMoniteur(Long moniteurId) {
        return leconRepository.findByMoniteurId(moniteurId);
    }

    public List<Lecon> listerParDate(LocalDate date) {
        return leconRepository.findByDate(date);
    }

    public List<Lecon> listerParPeriode(LocalDate debut, LocalDate fin) {
        return leconRepository.findByDateBetween(debut, fin);
    }

    public Lecon planifier(LeconRequest request) {
        Eleve eleve = eleveRepository.findById(request.getEleveId())
                .orElseThrow(() -> new ResourceNotFoundException("Élève", request.getEleveId()));

        Moniteur moniteur = moniteurRepository.findById(request.getMoniteurId())
                .orElseThrow(() -> new ResourceNotFoundException("Moniteur", request.getMoniteurId()));

        if (!moniteur.isActif()) {
            throw new BusinessException("Le moniteur " + moniteur.getNom() + " n'est pas actif");
        }

        if (request.getHeureDebut().isAfter(request.getHeureFin()) ||
                request.getHeureDebut().equals(request.getHeureFin())) {
            throw new BusinessException("L'heure de début doit être avant l'heure de fin");
        }

        if (eleve.estPerfectionnement() && request.getType() == TypeLecon.CODE) {
            throw new BusinessException("Élève en perfectionnement : leçons de conduite uniquement");
        }

        Vehicule vehicule = null;
        if (request.getVehiculeId() != null) {
            vehicule = vehiculeRepository.findById(request.getVehiculeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Véhicule", request.getVehiculeId()));
        } else if (request.getType() == TypeLecon.CONDUITE) {
            throw new BusinessException("Un véhicule est obligatoire pour une leçon de conduite");
        }

        Lecon lecon = Lecon.builder()
                .date(request.getDate())
                .heureDebut(request.getHeureDebut())
                .heureFin(request.getHeureFin())
                .eleve(eleve)
                .moniteur(moniteur)
                .vehicule(vehicule)
                .type(request.getType())
                .statut(StatutLecon.PLANIFIEE)
                .observations(request.getObservations())
                .build();
        return leconRepository.save(lecon);
    }

    public Lecon modifier(Long id, LeconRequest request) {
        Lecon lecon = trouverParId(id);
        if (lecon.getStatut() == StatutLecon.TERMINEE || lecon.getStatut() == StatutLecon.ANNULEE) {
            throw new BusinessException("Impossible de modifier une leçon terminée ou annulée");
        }
        Eleve eleve = eleveRepository.findById(request.getEleveId())
                .orElseThrow(() -> new ResourceNotFoundException("Élève", request.getEleveId()));
        Moniteur moniteur = moniteurRepository.findById(request.getMoniteurId())
                .orElseThrow(() -> new ResourceNotFoundException("Moniteur", request.getMoniteurId()));

        if (eleve.estPerfectionnement() && request.getType() == TypeLecon.CODE) {
            throw new BusinessException("Élève en perfectionnement : leçons de conduite uniquement");
        }

        Vehicule vehicule = null;
        if (request.getVehiculeId() != null) {
            vehicule = vehiculeRepository.findById(request.getVehiculeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Véhicule", request.getVehiculeId()));
        } else if (request.getType() == TypeLecon.CONDUITE) {
            throw new BusinessException("Un véhicule est obligatoire pour une leçon de conduite");
        }

        lecon.setDate(request.getDate());
        lecon.setHeureDebut(request.getHeureDebut());
        lecon.setHeureFin(request.getHeureFin());
        lecon.setEleve(eleve);
        lecon.setMoniteur(moniteur);
        lecon.setVehicule(vehicule);
        lecon.setType(request.getType());
        lecon.setObservations(request.getObservations());
        return leconRepository.save(lecon);
    }

    public Lecon changerStatut(Long id, StatutLecon statut) {
        Lecon lecon = trouverParId(id);
        lecon.setStatut(statut);

        if (statut == StatutLecon.TERMINEE) {
            Eleve eleve = lecon.getEleve();
            if (lecon.getType() == TypeLecon.CODE) {
                eleve.setNombreLeconsCode(eleve.getNombreLeconsCode() + 1);
            } else {
                eleve.setNombreLeconsConduite(eleve.getNombreLeconsConduite() + 1);
            }
            eleveRepository.save(eleve);
        }
        return leconRepository.save(lecon);
    }

    public void supprimer(Long id) {
        Lecon lecon = trouverParId(id);
        if (lecon.getStatut() == StatutLecon.TERMINEE) {
            throw new BusinessException("Impossible de supprimer une leçon terminée");
        }
        leconRepository.deleteById(id);
    }
}
