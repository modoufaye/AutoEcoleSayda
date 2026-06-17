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
    private long elevesNouveauxMois;

    private long totalMoniteurs;
    private long moniteursActifs;

    private long totalVehicules;
    private long vehiculesDisponibles;
    private long vehiculesEnMaintenance;

    private long totalLecons;
    private long leconsTerminees;
    private long leconsPlanifiees;

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
