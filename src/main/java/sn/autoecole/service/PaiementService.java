package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.DeclarationPaiementRequest;
import sn.autoecole.dto.PaiementRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Paiement;
import sn.autoecole.enums.MoyenPaiement;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.PaiementRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final EleveRepository eleveRepository;

    public List<Paiement> listerTous() {
        return paiementRepository.findAll();
    }

    public Paiement trouverParId(Long id) {
        return paiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement", id));
    }

    public List<Paiement> listerParEleve(Long eleveId) {
        return paiementRepository.findByEleveId(eleveId);
    }

    public List<Paiement> listerParPeriode(LocalDate debut, LocalDate fin) {
        return paiementRepository.findByDateBetween(debut, fin);
    }

    public Paiement creer(PaiementRequest request) {
        Eleve eleve = eleveRepository.findById(request.getEleveId())
                .orElseThrow(() -> new ResourceNotFoundException("Élève", request.getEleveId()));

        Paiement paiement = Paiement.builder()
                .date(request.getDate())
                .montant(request.getMontant())
                .eleve(eleve)
                .typePaiement(request.getTypePaiement())
                .statut(request.getStatut() != null ? request.getStatut() : StatutPaiement.PAYE)
                .description(request.getDescription())
                .build();
        return paiementRepository.save(paiement);
    }

    public Paiement modifier(Long id, PaiementRequest request) {
        Paiement paiement = trouverParId(id);
        Eleve eleve = eleveRepository.findById(request.getEleveId())
                .orElseThrow(() -> new ResourceNotFoundException("Élève", request.getEleveId()));

        paiement.setDate(request.getDate());
        paiement.setMontant(request.getMontant());
        paiement.setEleve(eleve);
        paiement.setTypePaiement(request.getTypePaiement());
        paiement.setDescription(request.getDescription());
        if (request.getStatut() != null) {
            paiement.setStatut(request.getStatut());
        }
        return paiementRepository.save(paiement);
    }

    public Paiement declarerPaiementMobile(Eleve eleve, DeclarationPaiementRequest request) {
        if (request.getMoyenPaiement() == MoyenPaiement.ESPECES) {
            throw new BusinessException("Seuls les paiements Wave ou Orange Money peuvent être déclarés en ligne");
        }
        String transactionId = request.getTransactionId().trim();
        if (paiementRepository.existsByTransactionIdIgnoreCase(transactionId)) {
            throw new BusinessException("Cet identifiant de transaction a déjà été déclaré");
        }

        Paiement paiement = Paiement.builder()
                .montant(request.getMontant())
                .eleve(eleve)
                .typePaiement(request.getTypePaiement())
                .statut(StatutPaiement.EN_ATTENTE)
                .moyenPaiement(request.getMoyenPaiement())
                .transactionId(transactionId)
                .description("Déclaré par l'élève — " + request.getMoyenPaiement().getLibelle())
                .build();
        return paiementRepository.save(paiement);
    }

    public Paiement changerStatut(Long id, StatutPaiement statut) {
        if (statut == null) {
            throw new BusinessException("Le statut est obligatoire");
        }
        Paiement paiement = trouverParId(id);
        paiement.setStatut(statut);
        return paiementRepository.save(paiement);
    }

    public void supprimer(Long id) {
        if (!paiementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Paiement", id);
        }
        paiementRepository.deleteById(id);
    }

    public BigDecimal totalEncaisse() {
        BigDecimal total = paiementRepository.sumMontantPaye();
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal totalEncaisseParEleve(Long eleveId) {
        BigDecimal total = paiementRepository.sumMontantPayeByEleve(eleveId);
        return total != null ? total : BigDecimal.ZERO;
    }
}
