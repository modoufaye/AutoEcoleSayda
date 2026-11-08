package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sn.autoecole.entity.Examen;
import sn.autoecole.enums.ResultatExamen;
import sn.autoecole.enums.TypeExamen;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExamenRepository extends JpaRepository<Examen, Long> {

    List<Examen> findByEleveId(Long eleveId);

    List<Examen> findByEleveIdAndType(Long eleveId, TypeExamen type);

    List<Examen> findByResultat(ResultatExamen resultat);

    /** Élèves ayant au moins un examen de ce type avec ce résultat (ex. admis au code). */
    @Query("select distinct x.eleve.id from Examen x where x.type = :type and x.resultat = :resultat")
    List<Long> eleveIdsParResultat(@Param("type") TypeExamen type, @Param("resultat") ResultatExamen resultat);

    List<Examen> findByDateBetween(LocalDate debut, LocalDate fin);

    @Query("SELECT COUNT(e) FROM Examen e WHERE e.resultat = :resultat")
    long countByResultat(@Param("resultat") ResultatExamen resultat);
}
