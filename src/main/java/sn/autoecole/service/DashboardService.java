package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.DashboardStats;
import sn.autoecole.enums.BoiteVitesse;
import sn.autoecole.enums.*;
import sn.autoecole.repository.*;
import sn.autoecole.enums.StatutSeance;

import sn.autoecole.entity.Eleve;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;

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
    private final ResultatQuizSeanceRepository resultatQuizSeanceRepository;

    public DashboardStats getStats() {
        LocalDate debutMois = LocalDate.now().withDayOfMonth(1);
        LocalDate finMois   = debutMois.plusMonths(1).minusDays(1);
        long enCours   = eleveRepository.countByStatut(StatutEleve.EN_COURS);
        long diplomes  = eleveRepository.countByStatut(StatutEleve.DIPLOME);
        long suspendus = eleveRepository.countByStatut(StatutEleve.SUSPENDU);
        return DashboardStats.builder()
                .totalEleves(enCours + diplomes + suspendus)
                .elevesEnCours(enCours)
                .elevesDiplomes(diplomes)
                .elevesSuspendus(suspendus)
                .elevesNouveauxMois(eleveRepository.countByDateInscriptionBetween(debutMois, finMois))
                .perfectionnementManuelle(eleveRepository.countPerfectionnementEnCours(BoiteVitesse.MANUELLE))
                .perfectionnementAutomatique(eleveRepository.countPerfectionnementEnCours(BoiteVitesse.AUTOMATIQUE))
                .totalMoniteurs(moniteurRepository.count())
                .moniteursActifs(moniteurRepository.findByActifTrue().size())
                .totalVehicules(vehiculeRepository.count())
                .vehiculesDisponibles(vehiculeRepository.findByStatut(StatutVehicule.DISPONIBLE).size())
                .vehiculesEnMaintenance(vehiculeRepository.findByStatut(StatutVehicule.EN_MAINTENANCE).size())
                .totalLecons(leconRepository.count())
                .leconsTerminees(leconRepository.findByStatut(StatutLecon.TERMINEE).size())
                .leconsPlanifiees(leconRepository.findByStatut(StatutLecon.PLANIFIEE).size())
                .seancesSuivies(resultatQuizSeanceRepository.count())
                .seancesReussies(resultatQuizSeanceRepository.countByReussiTrue())
                .totalExamens(examenRepository.count())
                .examensAdmis(examenRepository.countByResultat(ResultatExamen.ADMIS))
                .examensRefuses(examenRepository.countByResultat(ResultatExamen.REFUSE))
                .examensEnAttente(examenRepository.countByResultat(ResultatExamen.EN_ATTENTE))
                .totalEncaisse(paiementRepository.sumMontantPaye() != null
                        ? paiementRepository.sumMontantPaye() : java.math.BigDecimal.ZERO)
                .totalPaiements(paiementRepository.count())
                .revenusMois(paiementRepository.sumMontantPayeEntreDates(debutMois, finMois) != null
                        ? paiementRepository.sumMontantPayeEntreDates(debutMois, finMois) : java.math.BigDecimal.ZERO)
                .paiementsMois(paiementRepository.countPayeEntreDates(debutMois, finMois))
                .totalSeances(seanceRepository.count())
                .seancesPubliees(seanceRepository.countByStatut(StatutSeance.PUBLIE))
                .seancesBrouillon(seanceRepository.countByStatut(StatutSeance.BROUILLON))
                .build();
    }

    /* ── Répartition par localité ───────────────────────────── */

    /** Quartiers regroupés sous un nom commun (adresse saisie librement : « PARCELLE U7 », « Parcelles Assainies »…). */
    private static final LinkedHashMap<String, String> QUARTIERS = new LinkedHashMap<>();
    static {
        String[][] q = {
            {"PARCELLE", "Parcelles Assainies"}, {"KEUR MASSAR", "Keur Massar"}, {"GUEDIAWAYE", "Guédiawaye"},
            {"PIKINE", "Pikine"}, {"YEUMBEUL", "Yeumbeul"}, {"OUAKAM", "Ouakam"}, {"MEDINA", "Médina"},
            {"COLOBANE", "Colobane"}, {"YOFF", "Yoff"}, {"LIBERTE", "Liberté"}, {"HLM", "HLM"}, {"MALIKA", "Malika"},
            {"THIAROYE", "Thiaroye"}, {"MBAO", "Mbao"}, {"MARISTE", "Mariste"}, {"SICAP", "Sicap"},
            {"GRAND DAKAR", "Grand Dakar"}, {"CASTOR", "Castors"}, {"FASS", "Fass"}, {"MERMOZ", "Mermoz"},
            {"KEUR SALAM", "Keur Salam"}, {"OUEST FOIRE", "Ouest Foire"}, {"GRAND YOFF", "Grand Yoff"},
            {"PLATEAU", "Plateau"}, {"CAMBERENE", "Cambérène"}, {"GOLF", "Golf"}, {"ZONE DE CAPTAGE", "Zone de Captage"},
            {"BENE TALLY", "Usine Bene Tally"}, {"SACRE COEUR", "Sacré-Cœur"}, {"DIEUPPEUL", "Dieuppeul"}, {"ALMADIES", "Almadies"}, {"NGOR", "Ngor"},
        };
        for (String[] e : q) QUARTIERS.put(e[0], e[1]);
    }

    private static String quartier(String adresse) {
        if (adresse == null) return null;
        String t = Normalizer.normalize(adresse, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        if (t.isEmpty()) return null;
        // « GRAND YOFF » avant « YOFF » : la clé la plus longue qui correspond l'emporte
        return QUARTIERS.entrySet().stream().filter(e -> t.contains(e.getKey()))
                .max(Comparator.comparingInt(e -> e.getKey().length()))
                .map(Map.Entry::getValue)
                .orElseGet(() -> t.charAt(0) + t.substring(1).toLowerCase(Locale.FRENCH));
    }

    /**
     * Élèves par lieu d'inscription (tous les lieux) et 8 quartiers les plus représentés,
     * pour l'année d'inscription donnée (null : toutes). Archivés compris : ils se sont inscrits.
     */
    public Map<String, Object> localites(Integer annee) {
        List<Eleve> eleves = eleveRepository.findAll().stream()
                .filter(e -> annee == null || (e.getDateInscription() != null && e.getDateInscription().getYear() == annee))
                .toList();
        Map<String, Long> lieux = new LinkedHashMap<>();
        for (Site s : Site.values()) lieux.put(s.name(), 0L);
        Map<String, Long> quartiers = new HashMap<>();
        long sansAdresse = 0;
        for (var e : eleves) {
            Site lieu = e.getLieuInscription() != null ? e.getLieuInscription() : e.getSite();
            if (lieu != null) lieux.merge(lieu.name(), 1L, Long::sum);
            String q = quartier(e.getAdresse());
            if (q == null) sansAdresse++; else quartiers.merge(q, 1L, Long::sum);
        }
        var tri = quartiers.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed()).toList();
        var top = tri.stream().limit(8).map(e -> Map.<String, Object>of("nom", e.getKey(), "nombre", e.getValue())).toList();
        long autres = tri.stream().skip(8).mapToLong(Map.Entry::getValue).sum();
        List<Integer> annees = eleveRepository.findAll().stream().map(Eleve::getDateInscription)
                .filter(Objects::nonNull).map(LocalDate::getYear).distinct().sorted(Comparator.reverseOrder()).toList();
        return Map.of(
                "total", eleves.size(),
                "lieux", lieux.entrySet().stream().filter(e -> e.getValue() > 0)
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .map(e -> Map.<String, Object>of("lieu", e.getKey(), "nombre", e.getValue())).toList(),
                "quartiers", top,
                "autresQuartiers", autres,
                "nbAutresQuartiers", Math.max(0, tri.size() - 8),
                "sansAdresse", sansAdresse,
                "annees", annees);
    }
}
