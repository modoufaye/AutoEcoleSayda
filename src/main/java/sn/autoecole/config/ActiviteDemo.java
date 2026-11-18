package sn.autoecole.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.*;
import sn.autoecole.enums.*;
import sn.autoecole.repository.*;
import sn.autoecole.service.PalmaresService;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Démo seulement (DEMO_DONNEES=true) : une démo n'a pas de vrais élèves qui font des quiz chaque
 * semaine. Chaque dimanche à 22 h (Dakar), deux séances de révision de la semaine reçoivent des
 * résultats de quiz fictifs, pour que l'annonce « champions de la semaine » du lundi soit bien remplie.
 * Au démarrage, la semaine passée est complétée de même et son annonce republiée (une seule fois).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ActiviteDemo {

    @Value("${DEMO_DONNEES:false}")
    private boolean actif;

    static final String PREFIXE = "Révision · ";
    private static final Object[][] THEMES = {
        {"Les panneaux de danger", ThemeSeance.PANNEAUX_SIGNALISATION, "danger"},
        {"Obligations et interdictions", ThemeSeance.PANNEAUX_SIGNALISATION, "obligation-interdiction"},
        {"Les règles de priorité", ThemeSeance.REGLES_PRIORITE, "priorite-regles"},
        {"Le marquage au sol", ThemeSeance.SIGNALISATION_SOL, "lignes"},
        {"Feux et carrefours", ThemeSeance.FEUX_SIGNALISATION, "priorite-feux"},
    };

    private final SeanceRepository seanceRepo;
    private final ResultatQuizSeanceRepository resultatRepo;
    private final EleveRepository eleveRepo;
    private final UserRepository userRepo;
    private final AnnonceRepository annonceRepo;
    private final AnnonceLueRepository annonceLueRepo;
    private final PalmaresService palmares;

    /** Démarrage : semaine passée complétée et, si c'est nouveau, son annonce republiée. */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void auDemarrage() {
        if (!actif) return;
        LocalDateTime fin = PalmaresService.lundiCourant(), debut = fin.minusWeeks(1);
        if (!activite(debut, fin)) return;
        String periode = "du " + debut.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM")) + " au "
                + fin.minusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM")) + " :";
        annonceRepo.findAll().stream()
                .filter(a -> PalmaresService.TITRE_ANNONCE.equals(a.getTitre()) && a.getContenu() != null && a.getContenu().contains(periode))
                .forEach(a -> { annonceLueRepo.supprimerPourAnnonce(a.getId()); annonceRepo.delete(a); });
        int n = palmares.publierSemainePassee();
        log.info("Démo : semaine passée complétée, annonce des champions republiée ({} séance(s))", n);
    }

    /** Dimanche 22 h : la semaine en cours reçoit son activité, avant l'annonce du lundi 00 h. */
    @Scheduled(cron = "0 0 22 * * SUN", zone = "Africa/Dakar")
    @Transactional
    public void chaqueSemaine() {
        if (!actif) return;
        LocalDateTime debut = PalmaresService.lundiCourant();
        if (activite(debut, debut.plusWeeks(1))) log.info("Démo : activité de quiz de la semaine ajoutée");
    }

    /** Deux séances de révision dans [debut, fin), avec des quiz faits ; false si déjà fait. */
    boolean activite(LocalDateTime debut, LocalDateTime fin) {
        boolean deja = seanceRepo.findAll().stream().anyMatch(s -> s.getTitre() != null && s.getTitre().startsWith(PREFIXE)
                && s.getDateHeure() != null && !s.getDateHeure().isBefore(debut) && s.getDateHeure().isBefore(fin));
        if (deja) return false;
        List<Eleve> eleves = eleveRepo.findAll().stream()
                .filter(e -> e.getTypeFormation() == TypeFormation.PERMIS && e.getStatut() == StatutEleve.EN_COURS && !e.isArchive())
                .toList();
        User moniteur = userRepo.findAllByRole(RoleUser.MONITEUR).stream().findFirst().orElse(null);
        if (eleves.size() < 3 || moniteur == null) return false;
        Random hasard = new Random(debut.toLocalDate().toEpochDay());
        int semaine = (int) (debut.toLocalDate().toEpochDay() / 7);
        for (int i = 0; i < 2; i++) {
            Object[] t = THEMES[(semaine * 2 + i) % THEMES.length];
            LocalDateTime le = debut.plusDays(1 + 2L * i).withHour(9);   // mardi et jeudi, 9 h
            Seance s = seanceRepo.save(Seance.builder().titre(PREFIXE + t[0]).theme((ThemeSeance) t[1]).statut(StatutSeance.PUBLIE)
                    .dateHeure(le).moniteur(moniteur)
                    .programme(new ArrayList<>(List.of(new PartieCode((String) t[2], null, null))))
                    .eleves(new ArrayList<>(eleves)).createdAt(le.minusDays(1).withHour(18)).build());
            for (Eleve e : eleves) {
                if (hasard.nextInt(100) < 15) continue;   // quelques-uns n'ont pas fait le quiz
                int total = 10, score = Math.max(4, 10 - hasard.nextInt(6));
                boolean reussi = score >= 7;
                int tentatives = reussi && hasard.nextBoolean() ? 1 : 2;
                LocalDateTime fait = le.plusHours(8 + hasard.nextInt(30));
                if (!fait.isBefore(fin)) fait = fin.minusHours(1);
                resultatRepo.save(ResultatQuizSeance.builder().seanceId(s.getId()).eleveId(e.getId()).score(score).total(total)
                        .meilleurScore(score).meilleurTotal(total).reussi(reussi).tentatives(tentatives)
                        .derniereTentative(fait).build());
            }
        }
        return true;
    }
}
