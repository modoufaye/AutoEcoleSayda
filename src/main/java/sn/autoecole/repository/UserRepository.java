package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    /* Un email est insensible à la casse en pratique : un clavier mobile qui
       met une majuscule ne doit pas empêcher la connexion. Aligné sur ce que
       fait déjà EleveRepository.findByEmailIgnoreCase. */
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    /* Indispensable en regard de findByEmailIgnoreCase : sans cette variante,
       deux comptes ne différant que par la casse pourraient coexister et la
       recherche remonterait une NonUniqueResultException. */
    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByRole(RoleUser role);
}
