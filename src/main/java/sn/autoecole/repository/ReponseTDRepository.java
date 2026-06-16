package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.ReponseTD;

import java.util.List;
import java.util.Optional;

public interface ReponseTDRepository extends JpaRepository<ReponseTD, Long> {
    List<ReponseTD> findByEleveIdOrderByCreatedAtDesc(Long eleveId);
    Optional<ReponseTD> findByExerciceIdAndEleveId(Long exerciceId, Long eleveId);
    void deleteByExerciceId(Long exerciceId);
}
