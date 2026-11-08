package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.MessagePrive;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessagePriveRepository extends JpaRepository<MessagePrive, Long> {
    List<MessagePrive> findByConversationIdOrderByEnvoyeLeAscIdAsc(Long conversationId);
    Optional<MessagePrive> findFirstByConversationIdOrderByEnvoyeLeDescIdDesc(Long conversationId);
    long countByConversationIdAndCote(Long conversationId, MessagePrive.Cote cote);
    long countByConversationIdAndCoteAndEnvoyeLeAfter(Long conversationId, MessagePrive.Cote cote, LocalDateTime apres);
}
