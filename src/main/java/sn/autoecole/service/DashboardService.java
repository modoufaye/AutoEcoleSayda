package sn.autoecole.service;

import sn.autoecole.entity.Examen;
import sn.autoecole.enums.TypeExamen;
import sn.autoecole.enums.ResultatExamen;
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
    private final BureauService bureauService;
    private final SeanceService seanceService;
    private final ProgressionCodeRepository progressionCodeRepository;

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
                .diplomesTotal(eleveRepository.countByStatutArchivesCompris(StatutEleve.DIPLOME))
                .elevesNouveauxMois(eleveRepository.countByDateInscriptionBetween(debutMois, finMois))
                .permisEnCours(eleveRepository.countPermisEnCours())
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
        for (var b : bureauService.tous()) lieux.put(b.getCode(), 0L);
        lieux.put(sn.autoecole.entity.Bureau.EN_LIGNE, 0L);
        Map<String, Long> quartiers = new HashMap<>();
        long sansAdresse = 0;
        for (var e : eleves) {
            String lieu = e.getLieuInscription() != null ? e.getLieuInscription() : e.getSite();
            if (lieu != null) lieux.merge(lieu, 1L, Long::sum);
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

    /** Nouveaux élèves par mois d'une année (date d'inscription, archivés compris), permis et perfectionnement. */
    public Map<String, Object> inscriptionsParMois(int annee) {
        long[] permis = new long[12], perf = new long[12];
        List<Eleve> tous = eleveRepository.findAll();
        for (Eleve e : tous) {
            LocalDate d = e.getDateInscription();
            if (d == null || d.getYear() != annee) continue;
            if (e.estPerfectionnement()) perf[d.getMonthValue() - 1]++; else permis[d.getMonthValue() - 1]++;
        }
        List<Map<String, Object>> mois = new java.util.ArrayList<>();
        for (int m = 0; m < 12; m++) mois.add(Map.of("mois", m + 1, "permis", permis[m], "perfectionnement", perf[m]));
        List<Integer> annees = tous.stream().map(Eleve::getDateInscription).filter(Objects::nonNull)
                .map(LocalDate::getYear).distinct().sorted(Comparator.reverseOrder()).toList();
        return Map.of("annee", annee, "mois", mois, "annees", annees);
    }

    /**
     * Réussite aux examens (code et conduite) d'une année, ou de toutes (annee null). Le taux ne
     * compte que les résultats connus (admis / (admis + refusés)) : un examen en attente n'est ni
     * un succès ni un échec. « Premier coup » : candidats admis dès leur première tentative.
     * Détail par mois pour une année, par année sinon.
     */
    public Map<String, Object> reussite(Integer annee) {
        List<Examen> tous = examenRepository.findAll();
        List<Examen> choisis = tous.stream().filter(x -> x.getDate() != null && (annee == null || x.getDate().getYear() == annee)).toList();
        List<Integer> annees = tous.stream().map(Examen::getDate).filter(Objects::nonNull).map(LocalDate::getYear)
                .distinct().sorted(Comparator.reverseOrder()).toList();

        List<Integer> cles = annee != null
                ? java.util.stream.IntStream.rangeClosed(1, 12).boxed().toList()
                : annees.stream().sorted().toList();
        List<Map<String, Object>> periodes = new java.util.ArrayList<>();
        for (Integer cle : cles) {
            List<Examen> ici = choisis.stream().filter(x -> (annee != null ? x.getDate().getMonthValue() : x.getDate().getYear()) == cle).toList();
            periodes.add(Map.of("cle", cle, "code", bilan(ici, TypeExamen.CODE, false), "conduite", bilan(ici, TypeExamen.CONDUITE, false)));
        }
        Map<String, Object> r = new java.util.LinkedHashMap<>();
        r.put("annee", annee);
        r.put("annees", annees);
        r.put("code", bilan(choisis, TypeExamen.CODE, true));
        r.put("conduite", bilan(choisis, TypeExamen.CONDUITE, true));
        r.put("periodes", periodes);
        return r;
    }

    private static Map<String, Object> bilan(List<Examen> examens, TypeExamen type, boolean detail) {
        long admis = 0, refuses = 0, attente = 0, admis1 = 0, decides1 = 0;
        for (Examen x : examens) {
            if (x.getType() != type) continue;
            ResultatExamen res = x.getResultat();
            if (res == ResultatExamen.ADMIS) admis++;
            else if (res == ResultatExamen.REFUSE) refuses++;
            else attente++;
            if (x.getTentative() <= 1 && res != ResultatExamen.EN_ATTENTE) {
                decides1++;
                if (res == ResultatExamen.ADMIS) admis1++;
            }
        }
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("admis", admis);
        m.put("refuses", refuses);
        if (detail) {
            m.put("enAttente", attente);
            m.put("premierCoupAdmis", admis1);
            m.put("premierCoupPasses", decides1);
        }
        return m;
    }

    /** Seuils des reliquats (FCFA) : « moins de 50 000 », « 50 000 à 100 000 », « plus de 100 000 ». */
    private static final java.math.BigDecimal SEUIL_BAS = java.math.BigDecimal.valueOf(50_000), SEUIL_HAUT = java.math.BigDecimal.valueOf(100_000);

    /**
     * Argent : encaissements (paiements « payé ») d'une année par mois, ou de toutes par année ;
     * et reliquats des élèves non archivés dont le prix est fixé (prix − payé), répartis par
     * montant restant, avec les plus gros reliquats à relancer en premier. Les reliquats sont
     * ceux d'aujourd'hui, quelle que soit l'année choisie.
     */
    public Map<String, Object> finances(Integer annee) {
        List<sn.autoecole.entity.Paiement> payes = paiementRepository.findAll().stream()
                .filter(p -> p.getStatut() == StatutPaiement.PAYE && p.getDate() != null && p.getMontant() != null).toList();
        List<Integer> annees = payes.stream().map(p -> p.getDate().getYear()).distinct().sorted(Comparator.reverseOrder()).toList();
        List<Integer> cles = annee != null
                ? java.util.stream.IntStream.rangeClosed(1, 12).boxed().toList()
                : annees.stream().sorted().toList();
        List<Map<String, Object>> periodes = new ArrayList<>();
        java.math.BigDecimal totalPeriode = java.math.BigDecimal.ZERO;
        for (Integer cle : cles) {
            java.math.BigDecimal montant = java.math.BigDecimal.ZERO;
            long nombre = 0;
            for (var p : payes) {
                if (annee != null && (p.getDate().getYear() != annee || p.getDate().getMonthValue() != cle)) continue;
                if (annee == null && p.getDate().getYear() != cle) continue;
                montant = montant.add(p.getMontant());
                nombre++;
            }
            totalPeriode = totalPeriode.add(montant);
            periodes.add(Map.of("cle", cle, "montant", montant, "nombre", nombre));
        }

        Map<Long, java.math.BigDecimal> payeParEleve = new HashMap<>();
        for (Object[] r : paiementRepository.totauxPayesParEleve()) payeParEleve.put((Long) r[0], (java.math.BigDecimal) r[1]);
        long[] nb = new long[4];
        java.math.BigDecimal[] somme = { java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO };
        long sansPrix = 0;
        java.math.BigDecimal totalReste = java.math.BigDecimal.ZERO;
        List<Map<String, Object>> doivent = new ArrayList<>();
        for (Eleve e : eleveRepository.findByArchiveFalse()) {
            if (e.getMontantTotal() == null || e.getMontantTotal().signum() <= 0) { sansPrix++; continue; }
            java.math.BigDecimal paye = payeParEleve.getOrDefault(e.getId(), java.math.BigDecimal.ZERO);
            java.math.BigDecimal reste = e.getMontantTotal().subtract(paye);
            int t = reste.signum() <= 0 ? 0 : reste.compareTo(SEUIL_BAS) < 0 ? 1 : reste.compareTo(SEUIL_HAUT) <= 0 ? 2 : 3;
            nb[t]++;
            if (t > 0) {
                somme[t] = somme[t].add(reste);
                totalReste = totalReste.add(reste);
                Map<String, Object> d = new LinkedHashMap<>();
                d.put("id", e.getId());
                d.put("nom", ((e.getPrenom() == null ? "" : e.getPrenom()) + " " + (e.getNom() == null ? "" : e.getNom())).trim());
                d.put("telephone", e.getTelephone());
                d.put("reste", reste);
                d.put("paye", paye);
                d.put("total", e.getMontantTotal());
                doivent.add(d);
            }
        }
        doivent.sort((a, b) -> ((java.math.BigDecimal) b.get("reste")).compareTo((java.math.BigDecimal) a.get("reste")));
        String[] noms = { "solde", "moins50", "de50a100", "plus100" };
        List<Map<String, Object>> tranches = new ArrayList<>();
        for (int t = 0; t < 4; t++) tranches.add(Map.of("cle", noms[t], "nombre", nb[t], "montant", somme[t]));

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("annee", annee);
        r.put("annees", annees);
        r.put("periodes", periodes);
        r.put("totalPeriode", totalPeriode);
        r.put("tranches", tranches);
        r.put("totalReste", totalReste);
        r.put("elevesQuiDoivent", doivent.size());
        r.put("sansPrix", sansPrix);
        r.put("aRelancer", doivent.subList(0, Math.min(8, doivent.size())));
        return r;
    }

    /** Étapes du parcours d'un élève du permis, dans l'ordre. */
    private static final String[] ETAPES = { "inscrits", "coursCode", "presentesCode", "codeObtenu", "conduite", "permis" };

    /**
     * Parcours des élèves du permis inscrits une année (ou depuis le début), archivés compris :
     * combien atteignent chaque étape. Un élève qui a atteint une étape compte aussi pour les
     * précédentes (code obtenu sans cours enregistré dans l'appli = cours suivis). Les sortis
     * (abandon, suspension, archivé sans permis) sont comptés à l'étape où ils se sont arrêtés.
     */
    public Map<String, Object> parcours(Integer annee) {
        List<Eleve> tous = eleveRepository.findAll().stream().filter(e -> !e.estPerfectionnement()).toList();
        List<Integer> annees = tous.stream().map(Eleve::getDateInscription).filter(Objects::nonNull)
                .map(LocalDate::getYear).distinct().sorted(Comparator.reverseOrder()).toList();
        List<Eleve> cohorte = tous.stream().filter(e -> annee == null
                || (e.getDateInscription() != null && e.getDateInscription().getYear() == annee)).toList();

        Map<Long, Long> seancesCode = seanceService.seancesCodeParEleve();
        Set<Long> leconCode = new HashSet<>(), leconConduite = new HashSet<>();
        for (var l : leconRepository.findAll()) {
            if (l.getEleve() == null || l.getStatut() != StatutLecon.TERMINEE) continue;
            (l.getType() == TypeLecon.CODE ? leconCode : leconConduite).add(l.getEleve().getId());
        }
        Set<Long> presCode = new HashSet<>(), admisCode = new HashSet<>(), presConduite = new HashSet<>(), admisConduite = new HashSet<>();
        for (Examen x : examenRepository.findAll()) {
            if (x.getEleve() == null) continue;
            Long id = x.getEleve().getId();
            boolean admis = x.getResultat() == ResultatExamen.ADMIS;
            if (x.getType() == TypeExamen.CODE) { presCode.add(id); if (admis) admisCode.add(id); }
            else { presConduite.add(id); if (admis) admisConduite.add(id); }
        }

        long[] atteint = new long[ETAPES.length], sortis = new long[ETAPES.length];
        long enFormation = 0;
        for (Eleve e : cohorte) {
            Long id = e.getId();
            int etape = 0;
            if (seancesCode.getOrDefault(id, 0L) > 0 || leconCode.contains(id)) etape = 1;
            if (presCode.contains(id)) etape = 2;
            if (admisCode.contains(id)) etape = 3;
            if (leconConduite.contains(id) || presConduite.contains(id)) etape = Math.max(etape, 4);
            if (admisConduite.contains(id) || e.getStatut() == StatutEleve.DIPLOME) etape = 5;
            for (int k = 0; k <= etape; k++) atteint[k]++;
            boolean sorti = etape < 5 && (e.isArchive() || e.getStatut() == StatutEleve.ABANDONNE || e.getStatut() == StatutEleve.SUSPENDU);
            if (sorti) sortis[etape]++;
            else if (etape < 5) enFormation++;
        }
        List<Map<String, Object>> etapes = new ArrayList<>();
        for (int k = 0; k < ETAPES.length; k++) etapes.add(Map.of("cle", ETAPES[k], "nombre", atteint[k], "sortis", sortis[k]));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("annee", annee);
        r.put("annees", annees);
        r.put("etapes", etapes);
        r.put("enFormation", enFormation);
        r.put("sortis", Arrays.stream(sortis).sum());
        return r;
    }

    /**
     * Suivi pédagogique des élèves du permis en préparation du code (en cours, non archivés, pas
     * encore admis au code) : séances de code, séries et annales assimilées (70 % ou plus au moins
     * une fois) sur reçues/faites, répartition des élèves selon leur taux d'assimilation, et ceux
     * à accompagner en premier (le plus faible taux, au moins 3 éléments faits).
     */
    public Map<String, Object> pedagogie() {
        Set<Long> admisCode = new HashSet<>(examenRepository.eleveIdsParResultat(TypeExamen.CODE, ResultatExamen.ADMIS));
        List<Eleve> cohorte = eleveRepository.findByStatutAndArchiveFalse(StatutEleve.EN_COURS).stream()
                .filter(e -> !e.estPerfectionnement() && !admisCode.contains(e.getId())).toList();
        Map<Long, long[]> quizCode = seanceService.quizCodeParEleve();   // {reçues, quiz faits, assimilées}
        // Séries et annales : faites et assimilées par élève, {entraînement faites, assimilées, blanc faites, assimilées}
        Map<Long, long[]> series = new HashMap<>(), annales = new HashMap<>();
        for (var p : progressionCodeRepository.findAll()) {
            String ch = p.getChapitre();
            if (ch == null || p.getTentatives() <= 0) continue;
            boolean entr = ch.startsWith(sn.autoecole.controller.ProgressionCodeController.ENTRAINEMENT);
            if (entr) ch = ch.substring(sn.autoecole.controller.ProgressionCodeController.ENTRAINEMENT.length());
            Map<Long, long[]> cible = ch.startsWith("serie-") ? series : ch.startsWith("annale-") ? annales : null;
            if (cible == null) continue;
            long[] c = cible.computeIfAbsent(p.getEleveId(), k -> new long[4]);
            int o = entr ? 0 : 2;
            c[o]++;
            if (p.isReussi()) c[o + 1]++;
        }
        long[][] modes = new long[2][4];           // séries, annales : {entr. faites, entr. assimilées, blanc faites, blanc assimilées}
        long[][] totaux = new long[3][2];          // code (reçues), séries, annales (faites) : {faites, assimilées}
        long quizFaits = 0;
        long[] categories = new long[4];           // pas commencé, à accompagner, en bonne voie, avancés
        List<Map<String, Object>> faibles = new ArrayList<>();
        for (Eleve e : cohorte) {
            Long id = e.getId();
            long[] qc = quizCode.getOrDefault(id, new long[3]);
            long fCode = qc[0], okCode = qc[2];
            quizFaits += qc[1];
            long[] se4 = series.getOrDefault(id, new long[4]), an4 = annales.getOrDefault(id, new long[4]);
            for (int k = 0; k < 4; k++) { modes[0][k] += se4[k]; modes[1][k] += an4[k]; }
            long[] se = { se4[0] + se4[2], se4[1] + se4[3] }, an = { an4[0] + an4[2], an4[1] + an4[3] };
            totaux[0][0] += fCode; totaux[0][1] += okCode;
            totaux[1][0] += se[0]; totaux[1][1] += se[1];
            totaux[2][0] += an[0]; totaux[2][1] += an[1];
            long faites = fCode + se[0] + an[0], ok = okCode + se[1] + an[1];
            if (faites == 0) { categories[0]++; continue; }
            double t = (double) ok / faites;
            categories[t < 0.5 ? 1 : t < 0.8 ? 2 : 3]++;
            if (faites >= 3 && t < 0.5) {
                Map<String, Object> f = new LinkedHashMap<>();
                f.put("id", id);
                f.put("nom", ((e.getPrenom() == null ? "" : e.getPrenom()) + " " + (e.getNom() == null ? "" : e.getNom())).trim());
                f.put("telephone", e.getTelephone());
                f.put("assimilees", ok);
                f.put("faites", faites);
                faibles.add(f);
            }
        }
        faibles.sort(Comparator.<Map<String, Object>>comparingDouble(f -> (double) (long) f.get("assimilees") / (long) f.get("faites"))
                .thenComparing(f -> -(long) f.get("faites")));
        String[] noms = { "code", "series", "annales" };
        Map<String, Object> assimilation = new LinkedHashMap<>();
        for (int k = 0; k < 3; k++) assimilation.put(noms[k], Map.of("faites", totaux[k][0], "assimilees", totaux[k][1]));
        // Séries et annales, séparées par mode : entraînement et examen blanc
        for (int k = 1; k < 3; k++) assimilation.put(noms[k], Map.of("faites", totaux[k][0], "assimilees", totaux[k][1],
                "entrainement", Map.of("faites", modes[k - 1][0], "assimilees", modes[k - 1][1]),
                "blanc", Map.of("faites", modes[k - 1][2], "assimilees", modes[k - 1][3])));
        // Séances de code : reçues (avec quiz), quiz faits, assimilées
        assimilation.put("code", Map.of("faites", totaux[0][0], "quizFaits", quizFaits, "assimilees", totaux[0][1]));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("eleves", cohorte.size());
        r.put("assimilation", assimilation);
        r.put("categories", Map.of("pasCommence", categories[0], "aAccompagner", categories[1], "enBonneVoie", categories[2], "avances", categories[3]));
        r.put("aAccompagner", faibles.subList(0, Math.min(6, faibles.size())));
        return r;
    }
}
