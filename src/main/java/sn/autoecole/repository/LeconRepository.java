package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sn.autoecole.entity.Lecon;
import sn.autoecole.enums.StatutLecon;
import sn.autoecole.enums.TypeLecon;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeconRepository extends JpaRepository<Lecon, Long> {

    List<Lecon> findByEleveId(Long eleveId);

    List<Lecon> findByMoniteurId(Long moniteurId);

    long countByMoniteurId(Long moniteurId);

    List<Lecon> findByVehiculeId(Long vehiculeId);

    List<Lecon> findByDate(LocalDate date);

    List<Lecon> findByDateBetween(LocalDate debut, LocalDate fin);

    List<Lecon> findByStatut(StatutLecon statut);

    List<Lecon> findByEleveIdAndType(Long eleveId, TypeLecon type);

    @Query("SELECT COUNT(l) FROM Lecon l WHERE l.eleve.id = :eleveId AND l.type = :type AND l.statut = 'TERMINEE'")
    long countLeconsTerminees(@Param("eleveId") Long eleveId, @Param("type") TypeLecon type);

    @Query("SELECT l FROM Lecon l WHERE l.moniteur.id = :moniteurId AND l.date = :date")
    List<Lecon> findByMoniteurAndDate(@Param("moniteurId") Long moniteurId, @Param("date") LocalDate date);
}
