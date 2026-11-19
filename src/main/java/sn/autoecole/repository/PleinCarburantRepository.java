package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.PleinCarburant;

import java.util.List;

public interface PleinCarburantRepository extends JpaRepository<PleinCarburant, Long> {
    List<PleinCarburant> findAllByOrderByDateDescIdDesc();
    List<PleinCarburant> findByMoniteurIdOrderByDateDescIdDesc(Long moniteurId);
}
