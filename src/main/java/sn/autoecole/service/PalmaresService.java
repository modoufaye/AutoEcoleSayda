package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.*;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.enums.StatutSeance;
import sn.autoecole.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Palmarès des quiz de séance : meilleur score de chaque séance (ex aequo compris).
 * - Tableau d'honneur de l'élève (Mon Espace) : ses séances, résultats arrêtés à 00 h du jour.
 * - Annonce « champions de la semaine » chaque lundi à 00 h (heure de Dakar) pour la semaine écoulée,
 *   à tous les élèves ; une seule fois par semaine, et seulement s'il y a eu des quiz.
 * Noms affichés en entier (« Awa Diop »), lus par tous les élèves.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PalmaresService {

    public static final ZoneId DAKAR = ZoneId.of("Africa/Dakar");
    public static final String TITRE_ANNONCE = "🏆 Les champions de la semaine";
    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM");

    private final ResultatQuizSeanceRepository resultatRepo;
    private final SeanceRepository seanceRepo;
    private final EleveRepository eleveRepo;
    private final AnnonceRepository annonceRepo;
    private final AutoEcoleConfigRepository configRepo;
    private final EcoleService ecoleService;

    /** Meilleur score d'une séance et les élèves qui l'ont obtenu. */
    public record Ligne(Long seanceId, String titre, int score, int total, List<String> noms, Set<Long> eleveIds) {}

    /** Prénom et nom en entier : « Awa Diop » (espaces en trop retirés). */
    public static String nomCourt(Eleve e) {
        String prenom = e.getPrenom() == null ? "" : e.getPrenom().trim();
        String nom = e.getNom() == null ? "" : e.getNom().trim();
        return (prenom + " " + nom).trim().replaceAll("\\s+", " ");
    }

    /** Minuit (heure de Dakar) du jour courant. */
    public static LocalDateTime minuit() {
        return LocalDate.now(DAKAR).atStartOfDay();
    }

    /** Lundi 00 h de la semaine en cours (heure de Dakar) : fin de la semaine passée. */
    public static LocalDateTime lundiCourant() {
        return LocalDate.now(DAKAR).with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).atStartOfDay();
    }

    /** Annonce de la semaine passée, du lundi au dimanche : la même que celle du lundi 00 h. */
    @Transactional
    public int publierSemainePassee() {
        LocalDateTime fin = lundiCourant();
        return publier(fin.minusWeeks(1), fin);
    }

    /**
     * Meilleurs scores des séances publiées, pour les quiz faits dans [debut, fin).
     * seanceIds nul : toutes les séances. Triées par date de séance (la plus récente d'abord).
     */
    public List<Ligne> meilleurs(Collection<Long> seanceIds, LocalDateTime debut, LocalDateTime fin) {
        Map<Long, List<ResultatQuizSeance>> parSeance = resultatRepo.findAll().stream()
                .filter(r -> r.getMeilleurTotal() > 0 && r.getDerniereTentative() != null)
                .filter(r -> !r.getDerniereTentative().isBefore(debut) && r.getDerniereTentative().isBefore(fin))
                .filter(r -> seanceIds == null || seanceIds.contains(r.getSeanceId()))
                .collect(Collectors.groupingBy(ResultatQuizSeance::getSeanceId));
        if (parSeance.isEmpty()) return List.of();
        Map<Long, Seance> seances = seanceRepo.findAllById(parSeance.keySet()).stream()
                .filter(s -> s.getStatut() == StatutSeance.PUBLIE)
                .collect(Collectors.toMap(Seance::getId, Function.identity()));
        Set<Long> ids = parSeance.values().stream().flatMap(List::stream).map(ResultatQuizSeance::getEleveId).collect(Collectors.toSet());
        Map<Long, Eleve> eleves = eleveRepo.findAllById(ids).stream().collect(Collectors.toMap(Eleve::getId, Function.identity()));

        List<Ligne> lignes = new ArrayList<>();
        parSeance.forEach((seanceId, resultats) -> {
            Seance s = seances.get(seanceId);
            if (s == null) return;
            double meilleur = resultats.stream().mapToDouble(r -> (double) r.getMeilleurScore() / r.getMeilleurTotal()).max().orElse(0);
            if (meilleur <= 0) return;
            List<ResultatQuizSeance> premiers = resultats.stream()
                    .filter(r -> Math.abs((double) r.getMeilleurScore() / r.getMeilleurTotal() - meilleur) < 1e-9)
                    .filter(r -> eleves.containsKey(r.getEleveId()) && !eleves.get(r.getEleveId()).isArchive())
                    .sorted(Comparator.comparing(r -> nomCourt(eleves.get(r.getEleveId()))))
                    .toList();
            if (premiers.isEmpty()) return;
            ResultatQuizSeance ref = premiers.get(0);
            lignes.add(new Ligne(seanceId, s.getTitre(), ref.getMeilleurScore(), ref.getMeilleurTotal(),
                    premiers.stream().map(r -> nomCourt(eleves.get(r.getEleveId()))).toList(),
                    premiers.stream().map(ResultatQuizSeance::getEleveId).collect(Collectors.toSet())));
        });
        lignes.sort(Comparator.comparing((Ligne l) -> Optional.ofNullable(seances.get(l.seanceId()).getDateHeure()).orElse(LocalDateTime.MIN)).reversed());
        return lignes;
    }

    /** Tableau d'honneur de l'élève : ses séances publiées, résultats arrêtés à 00 h. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> pourEleve(String telephone) {
        Eleve eleve = eleveRepo.findFirstByTelephone(telephone).orElse(null);
        if (eleve == null) return List.of();
        Set<Long> mesSeances = seanceRepo.findByStatutAndElevesContainingOrderByDateHeureDesc(StatutSeance.PUBLIE, eleve).stream()
                .map(Seance::getId).collect(Collectors.toSet());
        if (mesSeances.isEmpty()) return List.of();
        return meilleurs(mesSeances, LocalDateTime.of(2000, 1, 1, 0, 0), minuit()).stream().map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("seanceId", l.seanceId()); m.put("titre", l.titre());
            m.put("score", l.score()); m.put("total", l.total());
            m.put("noms", l.noms()); m.put("moi", l.eleveIds().contains(eleve.getId()));
            return m;
        }).toList();
    }

    /** Chaque lundi à 00 h (Dakar) : annonce des champions de la semaine écoulée. */
    @Scheduled(cron = "0 0 0 * * MON", zone = "Africa/Dakar")
    @Transactional
    public void annonceHebdomadaire() {
        boolean active = configRepo.findAll().stream().findFirst().map(c -> !Boolean.FALSE.equals(c.getPalmaresHebdo())).orElse(true);
        if (!active) return;
        publierSemainePassee();
    }

    /**
     * Publie l'annonce pour [debut, fin) ; rien s'il n'y a eu aucun quiz, ni si elle a déjà été
     * publiée aujourd'hui. Renvoie le nombre de séances félicitées (0 : rien publié).
     */
    @Transactional
    public int publier(LocalDateTime debut, LocalDateTime fin) {
        List<Ligne> lignes = meilleurs(null, debut, fin);
        if (lignes.isEmpty()) { log.info("Palmarès : aucun quiz du {} au {}, pas d'annonce", debut, fin); return 0; }
        // Une seule annonce par semaine : déjà publiée pour cette période (contenu daté), on ne refait rien
        String periode = "du " + debut.format(JOUR) + " au " + fin.minusDays(1).format(JOUR);
        boolean deja = annonceRepo.findAll().stream().anyMatch(a -> TITRE_ANNONCE.equals(a.getTitre()) && a.getContenu() != null && a.getContenu().contains(periode + " :"));
        if (deja) return 0;
        StringBuilder t = new StringBuilder("Bravo aux meilleurs scores aux quiz des séances, ").append(periode).append(" :\n");
        int n = 0;
        for (Ligne l : lignes) {
            String ligne = "\n• « " + l.titre() + " » : " + String.join(", ", l.noms()) + " (" + l.score() + "/" + l.total() + ")";
            if (t.length() + ligne.length() > 1900) { t.append("\n…"); break; }
            t.append(ligne); n++;
        }
        t.append("\n\nContinuez comme ça, et à la semaine prochaine ! 💪");
        annonceRepo.save(Annonce.builder().titre(TITRE_ANNONCE).contenu(t.toString()).cible(Annonce.Cible.ELEVES)
                .auteurNom(ecoleService.nom()).auteurRole(RoleUser.SUPER_ADMIN).creeLe(LocalDateTime.now()).build());
        log.info("Palmarès : annonce de la semaine publiée ({} séance(s))", n);
        return n;
    }
}
