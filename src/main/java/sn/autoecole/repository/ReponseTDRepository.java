package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.ReponseTD;

import java.util.List;
import java.util.Optional;

public interface ReponseTDRepository extends JpaRepository<ReponseTD, Long> {
    List<ReponseTD> findByEleveIdOrderByCreatedAtDesc(Long eleveId);
    Optional<ReponseTD> findByQuestionIdAndEleveId(Long questionId, Long eleveId);
    void deleteByQuestionExerciceId(Long exerciceId);
    void deleteByQuestionExerciceIdAndEleveId(Long exerciceId, Long eleveId);

    @Query("SELECT DISTINCT r.eleve FROM ReponseTD r WHERE r.question.exercice.id = :exerciceId")
    List<Eleve> findDistinctElevesByExerciceId(@Param("exerciceId") Long exerciceId);
}
