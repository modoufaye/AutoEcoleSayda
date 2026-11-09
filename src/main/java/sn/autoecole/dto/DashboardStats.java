package sn.autoecole.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardStats {
    private long totalEleves;
    private long elevesEnCours;
    private long elevesDiplomes;
    private long elevesSuspendus;
    // Tous les diplômés, archivés compris (anciens élèves, perfectionnements terminés…)
    private long diplomesTotal;
    private long elevesNouveauxMois;
    // Perfectionnement en cours, par boîte de vitesses
    private long perfectionnementManuelle;
    private long perfectionnementAutomatique;

    private long totalMoniteurs;
    private long moniteursActifs;

    private long totalVehicules;
    private long vehiculesDisponibles;
    private long vehiculesEnMaintenance;

    private long totalLecons;
    private long leconsTerminees;
    private long leconsPlanifiees;

    // Séances de code suivies : un quiz de séance fait par un élève (élève × séance), dont réussis
    private long seancesSuivies;
    private long seancesReussies;

    private long totalExamens;
    private long examensAdmis;
    private long examensRefuses;
    private long examensEnAttente;

    private BigDecimal totalEncaisse;
    private long totalPaiements;
    private BigDecimal revenusMois;
    private long paiementsMois;

    private long totalSeances;
    private long seancesPubliees;
    private long seancesBrouillon;
}
