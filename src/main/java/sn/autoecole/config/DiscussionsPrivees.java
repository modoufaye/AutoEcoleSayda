package sn.autoecole.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.*;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.*;
import sn.autoecole.service.DiscussionEquipeService;

import java.util.Comparator;
import java.util.Objects;

/**
 * Discussions privées (une personne de l'auto-école par discussion), reprise des anciennes, qui
 * étaient partagées par tout le personnel : chacune revient à la personne de l'auto-école qui y a
 * écrit en premier, sinon au super admin. Plus de contrainte « une discussion par moniteur » (une
 * par moniteur et par personne). Sans effet une fois fait.
 */
@Component
@Order(20)   // après AdminSeeder (10) : le super admin existe
@RequiredArgsConstructor
@Slf4j
public class DiscussionsPrivees implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    private final ConversationRepository conversations;
    private final MessagePriveRepository messagesPrives;
    private final DiscussionEquipeRepository discussions;
    private final MessageEquipeRepository messagesEquipe;
    private final UserRepository users;

    @Override
    @Transactional
    public void run(String... args) {
        try { jdbc.execute("ALTER TABLE discussions_equipe DROP CONSTRAINT IF EXISTS uk_discussion_equipe_moniteur"); }
        catch (Exception e) { log.debug("Contrainte uk_discussion_equipe_moniteur : {}", e.getMessage()); }

        Long direction = users.findAllByRole(RoleUser.SUPER_ADMIN).stream().map(User::getId).min(Comparator.naturalOrder()).orElse(null);
        int n = 0;
        for (Conversation c : conversations.findByTypeAndAgentIdIsNull(Conversation.Type.ECOLE)) {
            Long agent = messagesPrives.findByConversationIdOrderByEnvoyeLeAscIdAsc(c.getId()).stream()
                    .filter(m -> m.getCote() == MessagePrive.Cote.EQUIPE).map(MessagePrive::getAuteurId).filter(Objects::nonNull)
                    .filter(this::personnel).findFirst().orElse(direction);
            if (agent == null) continue;
            c.setAgentId(agent); conversations.save(c); n++;
        }
        for (DiscussionEquipe d : discussions.findByAgentIdIsNull()) {
            Long agent = messagesEquipe.findByDiscussionIdOrderByEnvoyeLeAscIdAsc(d.getId()).stream()
                    .filter(m -> m.getCote() == MessageEquipe.Cote.ECOLE).map(MessageEquipe::getAuteurId).filter(Objects::nonNull)
                    .filter(this::personnel).findFirst().orElse(direction);
            if (agent == null) continue;
            d.setAgentId(agent); discussions.save(d); n++;
        }
        if (n > 0) log.info("Discussions privées : {} discussion(s) attribuée(s) à une personne de l'auto-école", n);
    }

    private boolean personnel(Long userId) {
        return users.findById(userId).map(u -> DiscussionEquipeService.ECOLE.contains(u.getRole())).orElse(false);
    }
}
