package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.QuizEnCours;

import java.util.List;
import java.util.Optional;

public interface QuizEnCoursRepository extends JpaRepository<QuizEnCours, Long> {
    List<QuizEnCours> findByEleveId(Long eleveId);
    Optional<QuizEnCours> findByEleveIdAndCle(Long eleveId, String cle);
}
