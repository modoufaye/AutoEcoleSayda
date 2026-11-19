package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.Eleve;
import sn.autoecole.enums.ResultatExamen;
import sn.autoecole.enums.StatutEleve;
import sn.autoecole.enums.TypeExamen;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.ExamenRepository;
import sn.autoecole.repository.ProgressionCodeRepository;
import sn.autoecole.repository.ResultatQuizSeanceRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Élèves du permis qui préparent le code (en cours, pas encore admis) et ne travaillent pas :
 * JAMAIS connectés, ou INACTIFS depuis {@link #JOURS_INACTIF} jours. L'administration les relance
 * par WhatsApp ; la date de relance est notée pour ne pas relancer deux fois de suite.
 * Dernière activité : la plus récente entre l'activité notée (PresenceService), la première
 * connexion et les derniers quiz de séance ou exercices de code (pour les comptes antérieurs).
 */
@Service
@RequiredArgsConstructor
public class RelanceService {

    public static final int JOURS_INACTIF = 7;

    private final EleveRepository eleveRepository;
    private final ExamenRepository examenRepository;
    private final ResultatQuizSeanceRepository resultatRepo;
    private final ProgressionCodeRepository progressionRepo;
    private final SeanceService seanceService;

    @Transactional(readOnly = true)
    public Map<String, Object> aRelancer() {
        Set<Long> admis = new HashSet<>(examenRepository.eleveIdsParResultat(TypeExamen.CODE, ResultatExamen.ADMIS));
        Map<Long, LocalDateTime> travail = new HashMap<>();
        resultatRepo.findAll().forEach(r -> plusRecent(travail, r.getEleveId(), r.getDerniereTentative()));
        progressionRepo.findAll().forEach(p -> plusRecent(travail, p.getEleveId(), p.getDerniereTentative()));
        Map<Long, long[]> quiz = seanceService.quizCodeParEleve();
        long publiees = seanceService.nombreSeancesAvecQuiz();
        LocalDateTime maintenant = LocalDateTime.now(), limite = maintenant.minusDays(JOURS_INACTIF);

        List<Map<String, Object>> eleves = new ArrayList<>();
        long jamais = 0, inactifs = 0;
        for (Eleve e : eleveRepository.findByStatutAndArchiveFalse(StatutEleve.EN_COURS)) {
            if (e.estPerfectionnement() || admis.contains(e.getId())) continue;
            LocalDateTime act = null;
            for (LocalDateTime d : new LocalDateTime[] { e.getDerniereActiviteLe(), e.getPremiereConnexionLe(), travail.get(e.getId()) })
                if (d != null && (act == null || d.isAfter(act))) act = d;
            if (act != null && act.isAfter(limite)) continue;   // actif
            boolean neverConnecte = act == null;
            if (neverConnecte) jamais++; else inactifs++;
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("id", e.getId());
            x.put("prenom", e.getPrenom());
            x.put("nom", e.getNom());
            x.put("telephone", e.getTelephone());
            x.put("moniteur", e.getMoniteur() == null ? null : e.getMoniteur().getPrenom() + " " + e.getMoniteur().getNom());
            x.put("groupe", neverConnecte ? "JAMAIS" : "INACTIF");
            x.put("derniereActivite", act);
            x.put("joursInactif", act == null ? null : Duration.between(act, maintenant).toDays());
            x.put("dateInscription", e.getDateInscription());
            x.put("bienvenueEnvoyeeLe", e.getBienvenueEnvoyeeLe());
            x.put("relanceLe", e.getRelanceLe());
            x.put("relancePar", e.getRelancePar());
            x.put("seancesAssimilees", quiz.getOrDefault(e.getId(), new long[3])[2]);
            eleves.add(x);
        }
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("joursInactif", JOURS_INACTIF);
        r.put("seancesPubliees", publiees);
        r.put("jamais", jamais);
        r.put("inactifs", inactifs);
        r.put("eleves", eleves);
        return r;
    }

    private static void plusRecent(Map<Long, LocalDateTime> m, Long id, LocalDateTime d) {
        if (id == null || d == null) return;
        m.merge(id, d, (a, b) -> a.isAfter(b) ? a : b);
    }

    /** La relance a été ouverte dans WhatsApp pour cet élève. */
    @Transactional
    public void noterRelance(Long id, String par) {
        Eleve e = eleveRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Élève introuvable"));
        e.setRelanceLe(LocalDateTime.now());
        e.setRelancePar(par);
        eleveRepository.save(e);
    }
}
