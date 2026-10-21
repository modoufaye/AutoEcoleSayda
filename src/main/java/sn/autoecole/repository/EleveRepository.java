package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.Site;
import sn.autoecole.enums.StatutEleve;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EleveRepository extends JpaRepository<Eleve, Long> {

    // Les listes ne montrent que les élèves non archivés ; les archivés ont leur propre liste.
    List<Eleve> findByArchiveFalse();

    List<Eleve> findByArchiveTrue();

    @Query("SELECT e FROM Eleve e WHERE e.archive = false AND (LOWER(e.nom) LIKE LOWER(CONCAT('%', :terme, '%')) OR LOWER(e.prenom) LIKE LOWER(CONCAT('%', :terme, '%')))")
    List<Eleve> rechercherActifs(@Param("terme") String terme);

    List<Eleve> findByStatutAndArchiveFalse(StatutEleve statut);

    List<Eleve> findByCategoriePermisAndArchiveFalse(CategoriePermis categorie);

    List<Eleve> findBySiteAndArchiveFalse(Site site);

    Optional<Eleve> findByNumeroCni(String numeroCni);

    Optional<Eleve> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<Eleve> findByMoniteurAndArchiveFalse(Moniteur moniteur);

    List<Eleve> findByMoniteurIdAndArchiveFalse(Long moniteurId);

    @Query("SELECT COUNT(e) FROM Eleve e WHERE e.statut = :statut AND e.archive = false")
    long countByStatut(@Param("statut") StatutEleve statut);

    @Query("SELECT COUNT(e) FROM Eleve e WHERE e.dateInscription >= :debut AND e.dateInscription <= :fin")
    long countByDateInscriptionBetween(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
