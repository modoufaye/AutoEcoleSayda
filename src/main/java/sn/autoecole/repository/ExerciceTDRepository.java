package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.ExerciceTD;

import java.util.List;

public interface ExerciceTDRepository extends JpaRepository<ExerciceTD, Long> {
    List<ExerciceTD> findAllByOrderByCreatedAtDesc();
}
