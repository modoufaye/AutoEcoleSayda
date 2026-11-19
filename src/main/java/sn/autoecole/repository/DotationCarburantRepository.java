package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.DotationCarburant;

import java.util.List;

public interface DotationCarburantRepository extends JpaRepository<DotationCarburant, Long> {
    List<DotationCarburant> findAllByOrderByDateDescIdDesc();
    List<DotationCarburant> findByMoniteurIdOrderByDateDescIdDesc(Long moniteurId);
}
