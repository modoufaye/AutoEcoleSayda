package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.DemandeInscription;
import sn.autoecole.enums.StatutDemande;

import java.util.List;

public interface DemandeInscriptionRepository extends JpaRepository<DemandeInscription, Long> {
    List<DemandeInscription> findByStatutOrderByCreeLeDesc(StatutDemande statut);
    boolean existsByTransactionIdIgnoreCaseAndStatutNot(String transactionId, StatutDemande statut);
    boolean existsByTelephoneAndStatut(String telephone, StatutDemande statut);
    long countByStatut(StatutDemande statut);
}
