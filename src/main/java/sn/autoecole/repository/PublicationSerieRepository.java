package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.PublicationSerie;
import sn.autoecole.entity.User;

import java.util.List;
import java.util.Optional;

public interface PublicationSerieRepository extends JpaRepository<PublicationSerie, Long> {
    List<PublicationSerie> findAllByOrderByCreeLeDesc();
    List<PublicationSerie> findByAuteurOrderByCreeLeDesc(User auteur);
    List<PublicationSerie> findByElevesContaining(Eleve eleve);
    Optional<PublicationSerie> findFirstByAuteurAndSerieAndMode(User auteur, String serie, String mode);
}
