package sn.autoecole.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.UserRepository;

import java.util.List;

/**
 * Supprime au démarrage les comptes ELEVE sans fiche élève correspondante (même email).
 * Avant la correction de EleveService.supprimer, supprimer un élève laissait son compte
 * actif : il pouvait encore se connecter.
 *
 * ApplicationReadyEvent plutôt que CommandLineRunner : s'exécute après tous les seeders,
 * donc après AdminSeeder qui (re)crée des comptes élèves de démo.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CompteOrphelinCleanup {

    private final UserRepository  userRepository;
    private final EleveRepository eleveRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void supprimerComptesOrphelins() {
        List<User> orphelins = userRepository.findAllByRole(RoleUser.ELEVE).stream()
                // exists plutôt que find : un email partagé par deux fiches ne doit pas faire échouer le démarrage
                .filter(u -> !eleveRepository.existsByEmailIgnoreCase(u.getEmail()))
                .toList();
        orphelins.forEach(u -> log.info("Compte élève orphelin supprimé : {}", u.getEmail()));
        userRepository.deleteAll(orphelins);
    }
}
