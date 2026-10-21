package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.autoecole.entity.DocumentEleve;
import sn.autoecole.enums.TypeDocument;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentEleveRepository extends JpaRepository<DocumentEleve, Long> {

    List<DocumentEleve> findByEleveIdOrderByDateAjoutDesc(Long eleveId);

    Optional<DocumentEleve> findByIdAndEleveId(Long id, Long eleveId);

    List<DocumentEleve> findByEleveIdAndType(Long eleveId, TypeDocument type);
}
