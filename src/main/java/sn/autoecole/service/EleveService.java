package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.EleveRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.Paiement;
import sn.autoecole.entity.User;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.enums.StatutEleve;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.enums.TypePaiement;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.PaiementRepository;
import sn.autoecole.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EleveService {

    private final EleveRepository    eleveRepository;
    private final MoniteurRepository moniteurRepository;
    private final UserRepository     userRepository;
    private final PaiementRepository paiementRepository;
    private final PasswordEncoder    passwordEncoder;

    public List<Eleve> listerTous() {
        return eleveRepository.findAll();
    }

    public Eleve trouverParId(Long id) {
        return eleveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Élève", id));
    }

    public List<Eleve> rechercher(String terme) {
        return eleveRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(terme, terme);
    }

    public List<Eleve> listerParStatut(StatutEleve statut) {
        return eleveRepository.findByStatut(statut);
    }

    public List<Eleve> listerParCategorie(CategoriePermis categorie) {
        return eleveRepository.findByCategoriePermis(categorie);
    }

    public Eleve creer(EleveRequest request) {
        if (request.getNumeroCni() != null && !request.getNumeroCni().isBlank()) {
            eleveRepository.findByNumeroCni(request.getNumeroCni()).ifPresent(e -> {
                throw new BusinessException("Un élève avec ce numéro CNI existe déjà: " + request.getNumeroCni());
            });
        }
        Eleve eleve = Eleve.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .dateNaissance(request.getDateNaissance())
                .telephone(request.getTelephone())
                .adresse(request.getAdresse())
                .email(request.getEmail())
                .numeroCni(request.getNumeroCni())
                .categoriePermis(request.getCategoriePermis())
                .dateInscription(LocalDate.now())
                .statut(request.getStatut() != null ? request.getStatut() : StatutEleve.EN_COURS)
                .docCertResidence(request.isDocCertResidence())
                .docCniLegalisee(request.isDocCniLegalisee())
                .docGroupeSanguin(request.isDocGroupeSanguin())
                .docVisiteMedicale(request.isDocVisiteMedicale())
                .docPhotos(request.isDocPhotos())
                .docTimbre(request.isDocTimbre())
                .docEnrolement(request.isDocEnrolement())
                .docDelivrance(request.isDocDelivrance())
                .build();
        eleve.setMoniteur(resolveMoniteur(request.getMoniteurId()));
        Eleve saved = eleveRepository.save(eleve);
        creerCompteParDefaut(saved);
        if (request.getMontantAvance() != null && request.getMontantAvance().compareTo(BigDecimal.ZERO) > 0) {
            paiementRepository.save(Paiement.builder()
                    .date(LocalDate.now())
                    .montant(request.getMontantAvance())
                    .eleve(saved)
                    .typePaiement(TypePaiement.INSCRIPTION)
                    .statut(StatutPaiement.PAYE)
                    .description("Versement à l'inscription")
                    .build());
        }
        return saved;
    }

    private void creerCompteParDefaut(Eleve eleve) {
        if (eleve.getEmail() == null || eleve.getEmail().isBlank()) return;
        if (userRepository.existsByEmail(eleve.getEmail())) return;
        String motDePasse = "Eleve@" + LocalDate.now().getYear();
        userRepository.save(User.builder()
                .nom(eleve.getPrenom() + " " + eleve.getNom())
                .email(eleve.getEmail())
                .motDePasse(passwordEncoder.encode(motDePasse))
                .role(RoleUser.ELEVE)
                .build());
    }

    public Eleve modifier(Long id, EleveRequest request) {
        Eleve eleve = trouverParId(id);
        if (request.getNumeroCni() != null && !request.getNumeroCni().equals(eleve.getNumeroCni())) {
            eleveRepository.findByNumeroCni(request.getNumeroCni()).ifPresent(e -> {
                throw new BusinessException("Ce numéro CNI est déjà utilisé");
            });
        }
        eleve.setNom(request.getNom());
        eleve.setPrenom(request.getPrenom());
        eleve.setDateNaissance(request.getDateNaissance());
        eleve.setTelephone(request.getTelephone());
        eleve.setAdresse(request.getAdresse());
        eleve.setEmail(request.getEmail());
        eleve.setNumeroCni(request.getNumeroCni());
        eleve.setCategoriePermis(request.getCategoriePermis());
        if (request.getStatut() != null) {
            eleve.setStatut(request.getStatut());
        }
        eleve.setDocCertResidence(request.isDocCertResidence());
        eleve.setDocCniLegalisee(request.isDocCniLegalisee());
        eleve.setDocGroupeSanguin(request.isDocGroupeSanguin());
        eleve.setDocVisiteMedicale(request.isDocVisiteMedicale());
        eleve.setDocPhotos(request.isDocPhotos());
        eleve.setDocTimbre(request.isDocTimbre());
        eleve.setDocEnrolement(request.isDocEnrolement());
        eleve.setDocDelivrance(request.isDocDelivrance());
        eleve.setMoniteur(resolveMoniteur(request.getMoniteurId()));
        return eleveRepository.save(eleve);
    }

    private Moniteur resolveMoniteur(Long moniteurId) {
        if (moniteurId == null) return null;
        return moniteurRepository.findById(moniteurId)
                .orElseThrow(() -> new BusinessException("Moniteur introuvable : " + moniteurId));
    }

    public void supprimer(Long id) {
        if (!eleveRepository.existsById(id)) {
            throw new ResourceNotFoundException("Élève", id);
        }
        eleveRepository.deleteById(id);
    }

    public Eleve changerStatut(Long id, StatutEleve statut) {
        Eleve eleve = trouverParId(id);
        eleve.setStatut(statut);
        return eleveRepository.save(eleve);
    }
}
