package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.AnnonceLue;

import java.util.Set;

public interface AnnonceLueRepository extends JpaRepository<AnnonceLue, Long> {

    @Query("select l.annonceId from AnnonceLue l where l.userId = :userId")
    Set<Long> annoncesLues(Long userId);

    @Modifying
    @Transactional
    @Query("delete from AnnonceLue l where l.annonceId = :annonceId")
    void supprimerPourAnnonce(Long annonceId);
}
