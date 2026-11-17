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
    private final ProgressionCodeRepository progressionRepo;

    /** Un champion d'une séance : son meilleur score. */
    public record Champion(Long eleveId, String nom, int score, int total) {}

    /** Les meilleurs élèves d'une séance (au plus CHAMPIONS_PAR_SEANCE), du premier au dernier. */
    public record Ligne(Long seanceId, String titre, List<Champion> champions) {}

    /** Trois champions par séance : une annonce lisible, même quand beaucoup d'élèves ont réussi. */
    public static final int CHAMPIONS_PAR_SEANCE = 3;

    /** Longueur maximale du texte de l'annonce (bien au-delà d'une semaine chargée). */
    public static final int LONGUEUR_MAX = 8000;

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
    public List<Ligne> meilleurs(Collection<Long> seanceIds, LocalDateTime debut, LocalDateTime fin, Set<String> exclus) {
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
            // Classement : meilleur score (en %), puis le moins de tentatives (réussi le plus vite),
            // puis le meilleur dernier score (régularité), puis le nom
            List<ResultatQuizSeance> premiers = resultats.stream()
                    .filter(r -> r.getMeilleurScore() > 0)
                    .filter(r -> eleves.containsKey(r.getEleveId()) && !eleves.get(r.getEleveId()).isArchive())
                    .filter(r -> !exclus.contains(cleNom(nomCourt(eleves.get(r.getEleveId())))))   // déjà félicité une autre semaine
                    .sorted(Comparator.comparingDouble((ResultatQuizSeance r) -> -(double) r.getMeilleurScore() / r.getMeilleurTotal())
                            .thenComparingInt(ResultatQuizSeance::getTentatives)
                            .thenComparingDouble(r -> r.getTotal() > 0 ? -(double) r.getScore() / r.getTotal() : 0)
                            .thenComparing(r -> nomCourt(eleves.get(r.getEleveId()))))
                    .limit(CHAMPIONS_PAR_SEANCE)
                    .toList();
            if (premiers.isEmpty()) return;
            lignes.add(new Ligne(seanceId, s.getTitre(), premiers.stream()
                    .map(r -> new Champion(r.getEleveId(), nomCourt(eleves.get(r.getEleveId())), r.getMeilleurScore(), r.getMeilleurTotal()))
                    .toList()));
        });
        lignes.sort(Comparator.comparing((Ligne l) -> Optional.ofNullable(seances.get(l.seanceId()).getDateHeure()).orElse(LocalDateTime.MIN)).reversed());
        // Séances au même titre : on ajoute leur date (« Les panneaux de danger · 10/11 »), et un numéro
        // si la date est la même aussi (« Les panneaux de danger · 10/11 (2) »)
        Map<String, List<Ligne>> parTitre = lignes.stream().collect(Collectors.groupingBy(Ligne::titre));
        Map<String, Integer> vus = new HashMap<>();
        return lignes.stream().map(l -> {
            if (parTitre.get(l.titre()).size() < 2) return l;
            LocalDateTime d = seances.get(l.seanceId()).getDateHeure();
            String date = d != null ? " · " + d.format(JOUR) : "";
            long memeDate = parTitre.get(l.titre()).stream().filter(x -> Objects.equals(
                    Optional.ofNullable(seances.get(x.seanceId()).getDateHeure()).map(t -> t.format(JOUR)).orElse(""),
                    d != null ? d.format(JOUR) : "")).count();
            String cle = l.titre() + date;
            String numero = memeDate > 1 ? " (" + vus.merge(cle, 1, Integer::sum) + ")" : "";
            return new Ligne(l.seanceId(), l.titre() + date + numero, l.champions());
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

    /** Nom comparable : minuscules, espaces simples. */
    private static String cleNom(String nom) {
        return nom == null ? "" : nom.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    /** Ligne d'une annonce : « • « Titre » : Awa Diop (10/10), Moussa Ba (9/10) » ou, avant, « … : Awa Diop, Moussa Ba (9/10) ». */
    private static final java.util.regex.Pattern LIGNE_ANNONCE = java.util.regex.Pattern.compile("^•\\s*«.+?»\\s*:\\s*(.+)$");

    /**
     * Élèves déjà félicités dans les annonces des champions publiées (sauf celle de la période en
     * cours) : leurs noms tels qu'écrits dans l'annonce. Supprimer une annonce les rend de nouveau
     * éligibles. Deux élèves homonymes comptent comme un seul.
     */
    Set<String> dejaFelicites(String periodeCourante) {
        Set<String> noms = new HashSet<>();
        for (Annonce a : annonceRepo.findAll()) {
            if (!TITRE_ANNONCE.equals(a.getTitre()) || a.getContenu() == null || a.getContenu().contains(periodeCourante + " :")) continue;
            for (String ligne : a.getContenu().split("\n")) {
                var m = LIGNE_ANNONCE.matcher(ligne.trim());
                if (!m.matches()) continue;
                for (String morceau : m.group(1).split(","))
                    noms.add(cleNom(morceau.replaceAll("\\(\\d+/\\d+\\)", "")));
            }
        }
        noms.remove("");
        return noms;
    }

    /** Titres des séries d'examen et des annales (contenu/seriesExamen.js, contenu/annales.js). */
    private static final Map<String, String> TITRES_SERIES = new LinkedHashMap<>();
    static {
        for (String b : List.of("b1", "b2", "b3", "b4")) TITRES_SERIES.put("serie-" + b, "Série d'examen " + b.toUpperCase() + " · examen blanc");
        for (String b : List.of("b1", "b2")) TITRES_SERIES.put("annale-" + b, "Annale · catalogue " + b.toUpperCase() + " · examen blanc");
    }

    /**
     * Champions des séries d'examen et des annales passées en examen blanc dans [debut, fin) :
     * même classement que les séances (meilleur score en %, puis le moins de tentatives, puis le nom).
     * Séries d'abord (B1 à B4), puis annales.
     */
    public List<Ligne> meilleursSeries(LocalDateTime debut, LocalDateTime fin, Set<String> exclus) {
        Map<String, List<ProgressionCode>> parSerie = progressionRepo.findAll().stream()
                .filter(p -> TITRES_SERIES.containsKey(p.getChapitre()))               // examen blanc seulement
                .filter(p -> p.getTotal() > 0 && p.getMeilleurScore() > 0 && p.getDerniereTentative() != null)
                .filter(p -> !p.getDerniereTentative().isBefore(debut) && p.getDerniereTentative().isBefore(fin))
                .collect(Collectors.groupingBy(ProgressionCode::getChapitre));
        if (parSerie.isEmpty()) return List.of();
        Set<Long> ids = parSerie.values().stream().flatMap(List::stream).map(ProgressionCode::getEleveId).collect(Collectors.toSet());
        Map<Long, Eleve> eleves = eleveRepo.findAllById(ids).stream().collect(Collectors.toMap(Eleve::getId, Function.identity()));
        List<Ligne> lignes = new ArrayList<>();
        TITRES_SERIES.forEach((chapitre, titre) -> {
            List<ProgressionCode> premiers = parSerie.getOrDefault(chapitre, List.of()).stream()
                    .filter(p -> eleves.containsKey(p.getEleveId()) && !eleves.get(p.getEleveId()).isArchive())
                    .filter(p -> !exclus.contains(cleNom(nomCourt(eleves.get(p.getEleveId())))))   // déjà félicité une autre semaine
                    .sorted(Comparator.comparingDouble((ProgressionCode p) -> -(double) p.getMeilleurScore() / p.getTotal())
                            .thenComparingInt(ProgressionCode::getTentatives)
                            .thenComparing(p -> nomCourt(eleves.get(p.getEleveId()))))
                    .limit(CHAMPIONS_PAR_SEANCE)
                    .toList();
            if (premiers.isEmpty()) return;
            lignes.add(new Ligne(null, titre, premiers.stream()
                    .map(p -> new Champion(p.getEleveId(), nomCourt(eleves.get(p.getEleveId())), p.getMeilleurScore(), p.getTotal()))
                    .toList()));
        });
        return lignes;
    }

    /**
     * Publie l'annonce pour [debut, fin) ; rien s'il n'y a eu aucun quiz, ni si elle a déjà été
     * publiée aujourd'hui. Renvoie le nombre de séances félicitées (0 : rien publié).
     */
    @Transactional
    public int publier(LocalDateTime debut, LocalDateTime fin) {
        // Séances d'abord, puis séries d'examen et annales (examen blanc)
        // Un élève n'est félicité qu'une seule semaine : ceux des annonces précédentes passent la main
        // (dans une même semaine, il peut figurer dans plusieurs séances)
        String periodeCourante = "du " + debut.format(JOUR) + " au " + fin.minusDays(1).format(JOUR);
        Set<String> exclus = dejaFelicites(periodeCourante);
        List<Ligne> lignes = new ArrayList<>(meilleurs(null, debut, fin, exclus));
        lignes.addAll(meilleursSeries(debut, fin, exclus));
        if (lignes.isEmpty()) { log.info("Palmarès : aucun quiz du {} au {}, pas d'annonce", debut, fin); return 0; }
        // Une seule annonce par semaine : déjà publiée pour cette période (contenu daté), on ne refait rien
        String periode = "du " + debut.format(JOUR) + " au " + fin.minusDays(1).format(JOUR);
        boolean deja = annonceRepo.findAll().stream().anyMatch(a -> TITRE_ANNONCE.equals(a.getTitre()) && a.getContenu() != null && a.getContenu().contains(periode + " :"));
        if (deja) return 0;
        StringBuilder t = new StringBuilder("Bravo aux meilleurs scores aux quiz des séances, aux séries d'examen et aux annales, ").append(periode).append(" :\n");
        int n = 0;
        for (Ligne l : lignes) {
            // « • « Titre » : Awa Diop (10/10), Moussa Ba (9/10) » : chaque champion avec son score
            String ligne = "\n• « " + l.titre() + " » : " + l.champions().stream()
                    .map(c -> c.nom() + " (" + c.score() + "/" + c.total() + ")").collect(Collectors.joining(", "));
            // Champ TEXT en base : la limite ne sert qu'à garder une annonce raisonnable (3 champions par séance)
            if (t.length() + ligne.length() > LONGUEUR_MAX) { t.append("\n…"); break; }
            t.append(ligne); n++;
        }
        t.append("\n\nContinuez comme ça, et à la semaine prochaine ! 💪");
        annonceRepo.save(Annonce.builder().titre(TITRE_ANNONCE).contenu(t.toString()).cible(Annonce.Cible.ELEVES)
                .auteurNom(ecoleService.nom()).auteurRole(RoleUser.SUPER_ADMIN).creeLe(LocalDateTime.now()).build());
        log.info("Palmarès : annonce de la semaine publiée ({} séance(s))", n);
        return n;
    }
}
