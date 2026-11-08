package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.Conversation;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByEleveId(Long eleveId);
    List<Conversation> findByType(Conversation.Type type);
    List<Conversation> findByTypeAndMoniteurId(Conversation.Type type, Long moniteurId);
    Optional<Conversation> findFirstByEleveIdAndTypeAndMoniteurIdIsNull(Long eleveId, Conversation.Type type);
    Optional<Conversation> findFirstByEleveIdAndTypeAndMoniteurId(Long eleveId, Conversation.Type type, Long moniteurId);
}
