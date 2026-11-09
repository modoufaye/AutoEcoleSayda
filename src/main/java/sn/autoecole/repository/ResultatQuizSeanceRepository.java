package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.ResultatQuizSeance;

import java.util.List;
import java.util.Optional;

public interface ResultatQuizSeanceRepository extends JpaRepository<ResultatQuizSeance, Long> {
    List<ResultatQuizSeance> findBySeanceId(Long seanceId);
    List<ResultatQuizSeance> findByEleveId(Long eleveId);
    Optional<ResultatQuizSeance> findBySeanceIdAndEleveId(Long seanceId, Long eleveId);
    void deleteBySeanceId(Long seanceId);
    long countByReussiTrue();
}
