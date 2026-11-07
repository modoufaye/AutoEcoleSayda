package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import sn.autoecole.entity.BlocContenu;

public interface BlocContenuRepository extends JpaRepository<BlocContenu, Long> {

    /** Séances différentes qui affichent ce fichier (vidéo ou audio de la médiathèque). */
    @Query("select count(distinct b.seance.id) from BlocContenu b where b.mediaUrl = :url")
    long seancesUtilisant(String url);
}
