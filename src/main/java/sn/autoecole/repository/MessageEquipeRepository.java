package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.MessageEquipe;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessageEquipeRepository extends JpaRepository<MessageEquipe, Long> {
    List<MessageEquipe> findByDiscussionIdOrderByEnvoyeLeAscIdAsc(Long discussionId);
    Optional<MessageEquipe> findFirstByDiscussionIdOrderByEnvoyeLeDescIdDesc(Long discussionId);
    long countByDiscussionIdAndCote(Long discussionId, MessageEquipe.Cote cote);
    long countByDiscussionIdAndCoteAndEnvoyeLeAfter(Long discussionId, MessageEquipe.Cote cote, LocalDateTime apres);
}
