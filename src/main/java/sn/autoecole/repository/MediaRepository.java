package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.Media;

import java.util.List;

public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findAllByOrderByCreeLeDesc();
}
