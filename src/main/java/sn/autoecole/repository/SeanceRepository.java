package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Seance;
import sn.autoecole.entity.User;
import sn.autoecole.enums.StatutSeance;

import java.util.List;

public interface SeanceRepository extends JpaRepository<Seance, Long> {
    List<Seance> findByMoniteurOrderByCreatedAtDesc(User moniteur);
    List<Seance> findAllByOrderByCreatedAtDesc();
    List<Seance> findByStatutAndElevesContainingOrderByDateHeureDesc(StatutSeance statut, Eleve eleve);
    long countByStatut(StatutSeance statut);
}
