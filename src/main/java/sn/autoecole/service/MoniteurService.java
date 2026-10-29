package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.MoniteurRequest;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.MoniteurRepository;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MoniteurService {

    private final MoniteurRepository moniteurRepository;

    public List<Moniteur> listerTous() {
        return moniteurRepository.findAll();
    }

    public List<Moniteur> listerActifs() {
        return moniteurRepository.findByActifTrue();
    }

    public Moniteur trouverParId(Long id) {
        return moniteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Moniteur", id));
    }

    public List<Moniteur> rechercher(String terme) {
        return moniteurRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(terme, terme);
    }

    public Moniteur creer(MoniteurRequest request) {
        Moniteur moniteur = Moniteur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(request.getTelephone())
                .email(request.getEmail())
                .numeroCni(request.getNumeroCni())
                .numeroPermis(request.getNumeroPermis())
                .dateEmbauche(request.getDateEmbauche())
                .photoUrl(request.getPhotoUrl())
                .categoriesAutorisees(request.getCategoriesAutorisees() != null
                        ? request.getCategoriesAutorisees() : new HashSet<>())
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();
        return moniteurRepository.save(moniteur);
    }

    public Moniteur modifier(Long id, MoniteurRequest request) {
        Moniteur moniteur = trouverParId(id);
        moniteur.setNom(request.getNom());
        moniteur.setPrenom(request.getPrenom());
        moniteur.setTelephone(request.getTelephone());
        moniteur.setEmail(request.getEmail());
        moniteur.setNumeroCni(request.getNumeroCni());
        moniteur.setNumeroPermis(request.getNumeroPermis());
        moniteur.setPhotoUrl(request.getPhotoUrl());
        if (request.getDateEmbauche() != null) {
            moniteur.setDateEmbauche(request.getDateEmbauche());
        }
        if (request.getCategoriesAutorisees() != null) {
            moniteur.setCategoriesAutorisees(request.getCategoriesAutorisees());
        }
        if (request.getActif() != null) {
            moniteur.setActif(request.getActif());
        }
        return moniteurRepository.save(moniteur);
    }

    public void supprimer(Long id) {
        if (!moniteurRepository.existsById(id)) {
            throw new ResourceNotFoundException("Moniteur", id);
        }
        moniteurRepository.deleteById(id);
    }

    public Moniteur toggleActif(Long id) {
        Moniteur moniteur = trouverParId(id);
        moniteur.setActif(!moniteur.isActif());
        return moniteurRepository.save(moniteur);
    }
}
