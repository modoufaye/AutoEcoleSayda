package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.DiscussionEquipe;

import java.util.Optional;

public interface DiscussionEquipeRepository extends JpaRepository<DiscussionEquipe, Long> {
    Optional<DiscussionEquipe> findFirstByMoniteurId(Long moniteurId);
}
