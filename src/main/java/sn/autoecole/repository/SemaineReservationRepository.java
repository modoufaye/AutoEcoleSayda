package sn.autoecole.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.autoecole.entity.SemaineReservation;

import java.time.LocalDate;
import java.util.Optional;

public interface SemaineReservationRepository extends JpaRepository<SemaineReservation, Long> {
    Optional<SemaineReservation> findFirstByLundi(LocalDate lundi);
    boolean existsByLundi(LocalDate lundi);
}
