package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.AudioWolof;

import java.util.Optional;

public interface AudioWolofRepository extends JpaRepository<AudioWolof, Long> {
    Optional<AudioWolof> findByChapitre(String chapitre);
}
