package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import sn.autoecole.entity.JournalAction;

import java.util.List;

public interface JournalActionRepository extends JpaRepository<JournalAction, Long>, JpaSpecificationExecutor<JournalAction> {

    /** Personnes présentes dans le journal : [utilisateurId, nom, role], pour le filtre de l'écran. */
    @Query("select distinct j.utilisateurId, j.nom, j.role from JournalAction j")
    List<Object[]> personnes();
}
