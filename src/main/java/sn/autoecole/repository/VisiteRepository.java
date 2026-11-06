package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.Visite;

import java.time.LocalDateTime;

public interface VisiteRepository extends JpaRepository<Visite, Long>, JpaSpecificationExecutor<Visite> {

    @Modifying
    @Transactional
    @Query("delete from Visite v where v.date < :avant")
    int supprimerAvant(LocalDateTime avant);

    /** Adresses IP différentes depuis une date (visiteurs uniques). */
    @Query("select count(distinct v.ip) from Visite v where v.date >= :depuis and v.type = :type")
    long adressesDepuis(Visite.Type type, LocalDateTime depuis);

    long countByTypeAndDateGreaterThanEqual(Visite.Type type, LocalDateTime depuis);
}
