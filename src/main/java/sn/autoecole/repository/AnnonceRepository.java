package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.Annonce;

import java.util.List;

public interface AnnonceRepository extends JpaRepository<Annonce, Long> {
    List<Annonce> findAllByOrderByCreeLeDesc();
}
