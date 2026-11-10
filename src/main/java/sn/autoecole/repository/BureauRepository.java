package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.Bureau;

import java.util.List;
import java.util.Optional;

public interface BureauRepository extends JpaRepository<Bureau, Long> {
    List<Bureau> findAllByOrderByOrdreAscIdAsc();
    Optional<Bureau> findByCode(String code);
    boolean existsByCode(String code);
}
