package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sn.autoecole.entity.Paiement;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.enums.TypePaiement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByEleveId(Long eleveId);

    Optional<Paiement> findByReference(String reference);

    List<Paiement> findByStatut(StatutPaiement statut);

    List<Paiement> findByTypePaiement(TypePaiement type);

    List<Paiement> findByDateBetween(LocalDate debut, LocalDate fin);

    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.statut = 'PAYE'")
    BigDecimal sumMontantPaye();

    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.eleve.id = :eleveId AND p.statut = 'PAYE'")
    BigDecimal sumMontantPayeByEleve(@Param("eleveId") Long eleveId);

    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.statut = 'PAYE' AND p.date >= :debut AND p.date <= :fin")
    BigDecimal sumMontantPayeEntreDates(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("SELECT COUNT(p) FROM Paiement p WHERE p.statut = 'PAYE' AND p.date >= :debut AND p.date <= :fin")
    long countPayeEntreDates(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
