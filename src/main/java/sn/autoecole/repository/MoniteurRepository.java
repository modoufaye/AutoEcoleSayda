package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.autoecole.entity.Moniteur;

import java.util.List;

@Repository
public interface MoniteurRepository extends JpaRepository<Moniteur, Long> {

    List<Moniteur> findByActifTrue();

    List<Moniteur> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom);

    java.util.Optional<Moniteur> findByEmailIgnoreCase(String email);

    /* Le téléphone normalisé est l'identifiant de connexion du moniteur (unique, contrôlé par MoniteurService). */
    java.util.Optional<Moniteur> findFirstByTelephone(String telephone);

    java.util.Optional<Moniteur> findFirstByTelephoneAndIdNot(String telephone, Long id);
}
