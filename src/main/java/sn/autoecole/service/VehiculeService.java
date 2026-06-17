package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.VehiculeRequest;
import sn.autoecole.entity.Vehicule;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.StatutVehicule;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.VehiculeRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VehiculeService {

    private final VehiculeRepository vehiculeRepository;

    public List<Vehicule> listerTous() {
        return vehiculeRepository.findAll();
    }

    public List<Vehicule> listerDisponibles() {
        return vehiculeRepository.findByStatut(StatutVehicule.DISPONIBLE);
    }

    public List<Vehicule> listerParStatut(StatutVehicule statut) {
        return vehiculeRepository.findByStatut(statut);
    }

    public List<Vehicule> listerParCategorie(CategoriePermis categorie) {
        return vehiculeRepository.findByCategorie(categorie);
    }

    public Vehicule trouverParId(Long id) {
        return vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule", id));
    }

    public Vehicule creer(VehiculeRequest request) {
        vehiculeRepository.findByImmatriculation(request.getImmatriculation()).ifPresent(v -> {
            throw new BusinessException("Un véhicule avec l'immatriculation " + request.getImmatriculation() + " existe déjà");
        });
        Vehicule vehicule = Vehicule.builder()
                .immatriculation(request.getImmatriculation())
                .marque(request.getMarque())
                .modele(request.getModele())
                .annee(request.getAnnee())
                .categorie(request.getCategorie())
                .kilometrage(request.getKilometrage())
                .statut(request.getStatut() != null ? request.getStatut() : StatutVehicule.DISPONIBLE)
                .observations(request.getObservations())
                .prochainEntretien(request.getProchainEntretien())
                .build();
        return vehiculeRepository.save(vehicule);
    }

    public Vehicule modifier(Long id, VehiculeRequest request) {
        Vehicule vehicule = trouverParId(id);
        if (!vehicule.getImmatriculation().equals(request.getImmatriculation())) {
            vehiculeRepository.findByImmatriculation(request.getImmatriculation()).ifPresent(v -> {
                throw new BusinessException("Cette immatriculation est déjà utilisée");
            });
        }
        vehicule.setImmatriculation(request.getImmatriculation());
        vehicule.setMarque(request.getMarque());
        vehicule.setModele(request.getModele());
        vehicule.setAnnee(request.getAnnee());
        vehicule.setCategorie(request.getCategorie());
        vehicule.setKilometrage(request.getKilometrage());
        vehicule.setObservations(request.getObservations());
        vehicule.setProchainEntretien(request.getProchainEntretien());
        if (request.getStatut() != null) {
            vehicule.setStatut(request.getStatut());
        }
        return vehiculeRepository.save(vehicule);
    }

    public Vehicule changerStatut(Long id, StatutVehicule statut) {
        Vehicule vehicule = trouverParId(id);
        vehicule.setStatut(statut);
        return vehiculeRepository.save(vehicule);
    }

    public void supprimer(Long id) {
        if (!vehiculeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Véhicule", id);
        }
        vehiculeRepository.deleteById(id);
    }
}
