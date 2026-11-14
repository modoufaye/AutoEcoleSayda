package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Lecon;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.enums.ResultatExamen;
import sn.autoecole.enums.StatutLecon;
import sn.autoecole.enums.TypeExamen;
import sn.autoecole.enums.TypeLecon;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.ExamenRepository;
import sn.autoecole.repository.LeconRepository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Réservation des leçons de conduite par l'élève, avec son moniteur et le véhicule de ce moniteur.
 * Du lundi au samedi : matin 9 h-13 h et soir 15 h-18 h, par créneaux d'une heure.
 * Chaque créneau accueille 3 élèves du moniteur (premier arrivé, premier servi).
 * L'élève réserve au plus 4 jours par semaine et une seule heure par jour (matin ou soir).
 * Il peut réserver la semaine en cours et la suivante, et annuler jusqu'à la veille.
 *
 * Pas de @Transactional : chaque enregistrement est validé aussitôt, et la méthode synchronisée
 * empêche deux élèves de prendre en même temps la dernière place d'un créneau.
 */
@Service
@RequiredArgsConstructor
public class CreneauxConduiteService {

    public static final List<LocalTime> MATIN = List.of(LocalTime.of(9, 0), LocalTime.of(10, 0), LocalTime.of(11, 0), LocalTime.of(12, 0));
    public static final List<LocalTime> SOIR = List.of(LocalTime.of(15, 0), LocalTime.of(16, 0), LocalTime.of(17, 0));
    public static final int PLACES = 3;
    public static final int JOURS_MAX = 4;
    static final String MARQUE = "Réservé par l'élève";

    private final LeconRepository leconRepository;
    private final ExamenRepository examenRepository;

    private static LocalDate aujourdhui() { return LocalDate.now(PalmaresService.DAKAR); }
    private static LocalDateTime maintenant() { return LocalDateTime.now(PalmaresService.DAKAR); }
    private static LocalDate lundi(LocalDate d) { return d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)); }
    private static boolean actif(Lecon l) { return l.getStatut() != StatutLecon.ANNULEE; }

    /** Raison pour laquelle l'élève ne peut pas réserver (null : il peut). */
    public String refus(Eleve e) {
        if (e.isArchive()) return "Votre dossier est archivé.";
        if (!e.estPerfectionnement()
                && !examenRepository.eleveIdsParResultat(TypeExamen.CODE, ResultatExamen.ADMIS).contains(e.getId()))
            return "Les réservations de conduite s'ouvrent après votre admission à l'examen du code.";
        Moniteur m = e.getMoniteur();
        if (m == null || !m.isActif()) return "Aucun moniteur ne vous est encore attribué. Contactez l'auto-école.";
        return null;
    }

    /** Semaines ouvertes à la réservation : la semaine en cours et la suivante (leurs lundis). */
    public List<LocalDate> semaines() {
        LocalDate l = lundi(aujourdhui());
        return List.of(l, l.plusWeeks(1));
    }

    public Map<String, Object> planning(Eleve e, LocalDate debut) {
        LocalDate lundi = debut == null ? semaines().get(0) : lundi(debut);
        Map<String, Object> r = new LinkedHashMap<>();
        String refus = refus(e);
        Moniteur m = e.getMoniteur();
        r.put("refus", refus);
        r.put("semaine", lundi);
        r.put("semaines", semaines());
        r.put("placesParCreneau", PLACES);
        r.put("joursMax", JOURS_MAX);
        if (m != null) {
            r.put("moniteur", Map.of("prenom", Objects.toString(m.getPrenom(), ""), "nom", Objects.toString(m.getNom(), "")));
            if (m.getVehicule() != null) r.put("vehicule", Map.of(
                    "marque", Objects.toString(m.getVehicule().getMarque(), ""),
                    "modele", Objects.toString(m.getVehicule().getModele(), ""),
                    "immatriculation", Objects.toString(m.getVehicule().getImmatriculation(), "")));
        }
        LocalDate samedi = lundi.plusDays(5);
        List<Lecon> miennes = leconRepository.findByEleveIdAndDateBetween(e.getId(), lundi, samedi).stream().filter(CreneauxConduiteService::actif).toList();
        r.put("joursReserves", miennes.stream().map(Lecon::getDate).distinct().count());
        List<Lecon> duMoniteur = m == null ? List.of()
                : leconRepository.findByMoniteurIdAndDateBetween(m.getId(), lundi, samedi).stream().filter(CreneauxConduiteService::actif).toList();
        LocalDateTime now = maintenant();
        List<Map<String, Object>> jours = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            LocalDate d = lundi.plusDays(i);
            List<Lecon> ceJour = miennes.stream().filter(l -> l.getDate().equals(d)).toList();
            List<Map<String, Object>> creneaux = new ArrayList<>();
            for (List<LocalTime> periode : List.of(MATIN, SOIR)) {
                for (LocalTime h : periode) {
                    long pris = duMoniteur.stream().filter(l -> l.getDate().equals(d) && l.getHeureDebut().equals(h)).count();
                    Lecon moi = ceJour.stream().filter(l -> l.getHeureDebut().equals(h)).findFirst().orElse(null);
                    Map<String, Object> c = new LinkedHashMap<>();
                    c.put("debut", h.toString());
                    c.put("fin", h.plusHours(1).toString());
                    c.put("periode", periode == MATIN ? "MATIN" : "SOIR");
                    c.put("places", Math.max(0, PLACES - pris));
                    c.put("passe", !LocalDateTime.of(d, h).isAfter(now));
                    if (moi != null) {
                        c.put("leconId", moi.getId());
                        c.put("annulable", moi.getStatut() == StatutLecon.PLANIFIEE && d.isAfter(aujourdhui()));
                    }
                    creneaux.add(c);
                }
            }
            Map<String, Object> j = new LinkedHashMap<>();
            j.put("date", d);
            // Leçon ce jour-là en dehors des créneaux (planifiée par l'auto-école) : le jour est pris
            j.put("dejaPris", !ceJour.isEmpty());
            j.put("creneaux", creneaux);
            jours.add(j);
        }
        r.put("jours", jours);
        return r;
    }

    public synchronized Lecon reserver(Eleve e, LocalDate date, LocalTime heure) {
        String refus = refus(e);
        if (refus != null) throw new BusinessException(refus);
        if (date == null || heure == null) throw new BusinessException("Choisissez un jour et une heure");
        if (!MATIN.contains(heure) && !SOIR.contains(heure)) throw new BusinessException("Ce créneau n'existe pas");
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) throw new BusinessException("Pas de conduite le dimanche");
        if (!semaines().contains(lundi(date))) throw new BusinessException("Vous pouvez réserver la semaine en cours et la suivante seulement");
        if (!LocalDateTime.of(date, heure).isAfter(maintenant())) throw new BusinessException("Ce créneau est déjà passé");

        LocalDate lundi = lundi(date);
        List<Lecon> miennes = leconRepository.findByEleveIdAndDateBetween(e.getId(), lundi, lundi.plusDays(5)).stream().filter(CreneauxConduiteService::actif).toList();
        if (miennes.stream().anyMatch(l -> l.getDate().equals(date)))
            throw new BusinessException("Vous avez déjà une leçon ce jour-là : une seule heure par jour");
        if (miennes.stream().map(Lecon::getDate).distinct().count() >= JOURS_MAX)
            throw new BusinessException("Vous avez déjà réservé " + JOURS_MAX + " jours cette semaine");

        Moniteur m = e.getMoniteur();
        long pris = leconRepository.findByMoniteurIdAndDateBetween(m.getId(), date, date).stream()
                .filter(l -> actif(l) && l.getHeureDebut().equals(heure)).count();
        if (pris >= PLACES) throw new BusinessException("Ce créneau est complet : choisissez-en un autre");

        return leconRepository.save(Lecon.builder()
                .date(date).heureDebut(heure).heureFin(heure.plusHours(1))
                .eleve(e).moniteur(m).vehicule(m.getVehicule())
                .type(TypeLecon.CONDUITE).statut(StatutLecon.PLANIFIEE)
                .observations(MARQUE)
                .build());
    }

    /** L'élève libère sa place, au plus tard la veille du cours. */
    public synchronized void annuler(Eleve e, Long leconId) {
        Lecon l = leconRepository.findById(leconId).orElseThrow(() -> new ResourceNotFoundException("Leçon", leconId));
        if (!l.getEleve().getId().equals(e.getId())) throw new ResourceNotFoundException("Leçon", leconId);
        if (l.getStatut() != StatutLecon.PLANIFIEE) throw new BusinessException("Cette leçon ne peut plus être annulée");
        if (!l.getDate().isAfter(aujourdhui()))
            throw new BusinessException("Annulation possible jusqu'à la veille du cours. Contactez l'auto-école.");
        leconRepository.delete(l);
    }
}
