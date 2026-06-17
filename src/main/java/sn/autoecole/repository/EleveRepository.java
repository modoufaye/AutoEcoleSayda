package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.StatutEleve;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EleveRepository extends JpaRepository<Eleve, Long> {

    List<Eleve> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom);

    List<Eleve> findByStatut(StatutEleve statut);

    List<Eleve> findByCategoriePermis(CategoriePermis categorie);

    Optional<Eleve> findByNumeroCni(String numeroCni);

    Optional<Eleve> findByEmailIgnoreCase(String email);

    List<Eleve> findByMoniteur(Moniteur moniteur);

    List<Eleve> findByMoniteurId(Long moniteurId);

    @Query("SELECT COUNT(e) FROM Eleve e WHERE e.statut = :statut")
    long countByStatut(@Param("statut") StatutEleve statut);

    @Query("SELECT COUNT(e) FROM Eleve e WHERE e.dateInscription >= :debut AND e.dateInscription <= :fin")
    long countByDateInscriptionBetween(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
