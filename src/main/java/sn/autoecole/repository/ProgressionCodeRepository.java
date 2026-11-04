package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.ProgressionCode;

import java.util.List;
import java.util.Optional;

public interface ProgressionCodeRepository extends JpaRepository<ProgressionCode, Long> {
    List<ProgressionCode> findByEleveId(Long eleveId);
    Optional<ProgressionCode> findByEleveIdAndChapitre(Long eleveId, String chapitre);
}
