package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.DashboardStats;
import sn.autoecole.enums.*;
import sn.autoecole.repository.*;
import sn.autoecole.enums.StatutSeance;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final EleveRepository eleveRepository;
    private final MoniteurRepository moniteurRepository;
    private final VehiculeRepository vehiculeRepository;
    private final LeconRepository leconRepository;
    private final ExamenRepository examenRepository;
    private final PaiementRepository paiementRepository;
    private final SeanceRepository seanceRepository;

    public DashboardStats getStats() {
        LocalDate debutMois = LocalDate.now().withDayOfMonth(1);
        LocalDate finMois   = debutMois.plusMonths(1).minusDays(1);
        return DashboardStats.builder()
                .totalEleves(eleveRepository.count())
                .elevesEnCours(eleveRepository.countByStatut(StatutEleve.EN_COURS))
                .elevesDiplomes(eleveRepository.countByStatut(StatutEleve.DIPLOME))
                .elevesSuspendus(eleveRepository.countByStatut(StatutEleve.SUSPENDU))
                .elevesNouveauxMois(eleveRepository.countByDateInscriptionBetween(debutMois, finMois))
                .totalMoniteurs(moniteurRepository.count())
                .moniteursActifs(moniteurRepository.findByActifTrue().size())
                .totalVehicules(vehiculeRepository.count())
                .vehiculesDisponibles(vehiculeRepository.findByStatut(StatutVehicule.DISPONIBLE).size())
                .vehiculesEnMaintenance(vehiculeRepository.findByStatut(StatutVehicule.EN_MAINTENANCE).size())
                .totalLecons(leconRepository.count())
                .leconsTerminees(leconRepository.findByStatut(StatutLecon.TERMINEE).size())
                .leconsPlanifiees(leconRepository.findByStatut(StatutLecon.PLANIFIEE).size())
                .totalExamens(examenRepository.count())
                .examensAdmis(examenRepository.countByResultat(ResultatExamen.ADMIS))
                .examensRefuses(examenRepository.countByResultat(ResultatExamen.REFUSE))
                .examensEnAttente(examenRepository.countByResultat(ResultatExamen.EN_ATTENTE))
                .totalEncaisse(paiementRepository.sumMontantPaye() != null
                        ? paiementRepository.sumMontantPaye() : java.math.BigDecimal.ZERO)
                .totalPaiements(paiementRepository.count())
                .totalSeances(seanceRepository.count())
                .seancesPubliees(seanceRepository.countByStatut(StatutSeance.PUBLIE))
                .seancesBrouillon(seanceRepository.countByStatut(StatutSeance.BROUILLON))
                .build();
    }
}
