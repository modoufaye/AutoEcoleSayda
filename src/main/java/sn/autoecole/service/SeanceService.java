package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.BlocRequest;
import sn.autoecole.dto.SeanceRequest;
import sn.autoecole.dto.SeanceResponse;
import sn.autoecole.controller.ProgressionCodeController;
import sn.autoecole.entity.BlocContenu;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.PartieCode;
import sn.autoecole.entity.ResultatQuizSeance;
import sn.autoecole.entity.Seance;
import sn.autoecole.entity.User;
import sn.autoecole.enums.StatutSeance;
import sn.autoecole.enums.ThemeSeance;
import sn.autoecole.enums.TypeBloc;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.ResultatQuizSeanceRepository;
import sn.autoecole.repository.SeanceRepository;
import sn.autoecole.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SeanceService {

    private final SeanceRepository seanceRepo;
    private final UserRepository userRepo;
    private final EleveRepository eleveRepo;
    private final MoniteurRepository moniteurRepo;
    private final ResultatQuizSeanceRepository resultatRepo;

    private static final double SEUIL = 0.7;

    @Transactional(readOnly = true)
    public List<SeanceResponse> findAll() {
        return seanceRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SeanceResponse> findByMoniteur(String email) {
        User moniteur = userRepo.findByEmail(email).orElseThrow();
        return seanceRepo.findByMoniteurOrderByCreatedAtDesc(moniteur).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SeanceResponse> findPublishedForEleve(String email) {
        // Lien entre compte auth (User.email) et profil école (Eleve.email)
        Eleve eleve = eleveRepo.findFirstByTelephone(email).orElse(null);
        if (eleve == null) return List.of();
        // Perfectionnement (conduite seule) : uniquement les séances qui publient de la conduite
        return seanceRepo.findByStatutAndElevesContainingOrderByDateHeureDesc(StatutSeance.PUBLIE, eleve).stream()
                .filter(s -> !eleve.estPerfectionnement() || s.getProgramme().stream().anyMatch(SeanceService::conduite))
                .map(s -> pourEleve(s, eleve))
                .toList();
    }

    @Transactional(readOnly = true)
    public SeanceResponse findByIdForEleve(Long id, String email) {
        Eleve eleve = eleveRepo.findFirstByTelephone(email).orElse(null);
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        if (s.getStatut() != StatutSeance.PUBLIE || eleve == null || !s.getEleves().contains(eleve)
                || (eleve.estPerfectionnement() && s.getProgramme().stream().noneMatch(SeanceService::conduite))) {
            throw new BusinessException("Séance non accessible");
        }
        return pourEleve(s, eleve);
    }

    /** Retourne les élèves assignés à ce moniteur (via le profil Moniteur matchant l'email du compte User) */
    @Transactional(readOnly = true)
    public List<Eleve> findElevesByMoniteur(String moniteurEmail) {
        Moniteur moniteur = moniteurRepo.findFirstByTelephone(moniteurEmail).orElse(null);
        if (moniteur == null) return List.of();
        return eleveRepo.findByMoniteurAndArchiveFalse(moniteur);
    }

    @Transactional(readOnly = true)
    public List<Eleve> findAllEleves() {
        return eleveRepo.findByArchiveFalse();
    }

    public SeanceResponse create(SeanceRequest req, String moniteurEmail) {
        User moniteur = userRepo.findByEmail(moniteurEmail).orElseThrow();
        Seance s = new Seance();
        s.setMoniteur(moniteur);
        s.setTitre(req.titre());
        applyFields(s, req);
        return toResponse(seanceRepo.save(s));
    }

    /** gestion : super admin et administrateurs, qui modifient et suppriment toutes les séances. */
    public SeanceResponse update(Long id, SeanceRequest req, String moniteurEmail, boolean gestion) {
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        verifierAuteur(s, moniteurEmail, gestion);
        s.setTitre(req.titre());
        applyFields(s, req);
        return toResponse(seanceRepo.save(s));
    }

    public void delete(Long id, String moniteurEmail, boolean gestion) {
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        verifierAuteur(s, moniteurEmail, gestion);
        resultatRepo.deleteBySeanceId(s.getId());
        seanceRepo.delete(s);
    }

    /** Un moniteur ne modifie ou ne supprime que ses propres séances ; l'administration, toutes. */
    private static void verifierAuteur(Seance s, String email, boolean gestion) {
        if (!gestion && !s.getMoniteur().getEmail().equals(email))
            throw new BusinessException("Seul le moniteur qui a créé cette séance, ou l'administration, peut la modifier ou la supprimer");
    }

    /* ── Quiz de la séance de code ── */

    /** L'élève termine le quiz d'une séance publiée pour lui : dernier essai, meilleure note, erreurs. */
    public ResultatQuizSeance enregistrerQuiz(Long id, String telephone, int score, int total, List<String> erreurs) {
        Eleve eleve = eleveRepo.findFirstByTelephone(telephone)
                .orElseThrow(() -> new ResourceNotFoundException("Profil élève introuvable"));
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        if (s.getStatut() != StatutSeance.PUBLIE || !s.getEleves().contains(eleve))
            throw new BusinessException("Séance non accessible");
        if (s.getProgramme().isEmpty() || (eleve.estPerfectionnement() && s.getProgramme().stream().noneMatch(SeanceService::conduite)))
            throw new BusinessException("Cette séance n'a pas de quiz");
        if (total <= 0 || total > 80 || score < 0 || score > total) throw new BusinessException("Résultat invalide");
        ResultatQuizSeance r = resultatRepo.findBySeanceIdAndEleveId(s.getId(), eleve.getId())
                .orElseGet(() -> ResultatQuizSeance.builder().seanceId(s.getId()).eleveId(eleve.getId()).build());
        if (r.getTentatives() == 0 || score * (double) r.getMeilleurTotal() >= r.getMeilleurScore() * (double) total) {
            r.setMeilleurScore(score);
            r.setMeilleurTotal(total);
        }
        r.setScore(score);
        r.setTotal(total);
        r.setReussi(r.isReussi() || score >= Math.ceil(SEUIL * total));
        r.setTentatives(r.getTentatives() + 1);
        List<String> lignes = erreurs == null ? List.of() : erreurs.stream()
                .filter(x -> x != null && !x.isBlank()).limit(80)
                .map(x -> x.replace('\n', ' ').trim()).map(x -> x.length() > 300 ? x.substring(0, 300) : x).toList();
        r.setErreurs(lignes.isEmpty() ? null : String.join("\n", lignes));
        r.setDerniereTentative(LocalDateTime.now());
        return resultatRepo.save(r);
    }

    /** Fiche de l'élève (administration, moniteur) : séances publiées pour lui, les plus récentes
        d'abord, avec leurs parties de cours et son résultat au quiz. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> publieesPourEleve(Eleve eleve) {
        Map<Long, ResultatQuizSeance> resultats = new LinkedHashMap<>();
        resultatRepo.findByEleveId(eleve.getId()).forEach(r -> resultats.put(r.getSeanceId(), r));
        List<Map<String, Object>> liste = new ArrayList<>();
        for (Seance s : seanceRepo.findByStatutAndElevesContainingOrderByDateHeureDesc(StatutSeance.PUBLIE, eleve)) {
            List<PartieCode> programme = eleve.estPerfectionnement()
                    ? s.getProgramme().stream().filter(SeanceService::conduite).toList() : s.getProgramme();
            if (eleve.estPerfectionnement() && programme.isEmpty()) continue;   // il ne la voit pas
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("titre", s.getTitre());
            m.put("date", s.getDateHeure() != null ? s.getDateHeure() : s.getCreatedAt());
            m.put("moniteurNom", s.getMoniteur() != null ? s.getMoniteur().getNom() : null);
            m.put("programme", programme);
            m.put("resultat", resultats.get(s.getId()));
            liste.add(m);
        }
        liste.sort((a, b) -> ((LocalDateTime) b.get("date")).compareTo((LocalDateTime) a.get("date")));
        return liste;
    }

    @Transactional(readOnly = true)
    public List<ResultatQuizSeance> mesResultats(String telephone) {
        return eleveRepo.findFirstByTelephone(telephone)
                .map(e -> resultatRepo.findByEleveId(e.getId())).orElse(List.of());
    }

    /** Résultats d'une séance pour son moniteur (ou l'administration) : chaque élève de la séance,
        avec son résultat s'il a passé le quiz. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> resultats(Long id, String moniteurEmail, boolean admin) {
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        if (!admin && !s.getMoniteur().getEmail().equals(moniteurEmail)) throw new BusinessException("Non autorisé");
        Map<Long, ResultatQuizSeance> parEleve = new LinkedHashMap<>();
        resultatRepo.findBySeanceId(id).forEach(r -> parEleve.put(r.getEleveId(), r));
        List<Map<String, Object>> liste = new ArrayList<>();
        for (Eleve e : s.getEleves()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("eleveId", e.getId());
            m.put("nom", e.getPrenom() + " " + e.getNom());
            m.put("telephone", e.getTelephone());
            m.put("resultat", parEleve.get(e.getId()));
            liste.add(m);
        }
        return liste;
    }

    private void applyFields(Seance s, SeanceRequest req) {
        if (req.dateHeure() != null && !req.dateHeure().isBlank()) {
            String dh = req.dateHeure().length() == 16 ? req.dateHeure() + ":00" : req.dateHeure();
            s.setDateHeure(LocalDateTime.parse(dh));
        }
        if (req.theme() != null && !req.theme().isBlank()) {
            s.setTheme(ThemeSeance.valueOf(req.theme()));
        }
        s.setStatut(req.statut() != null && !req.statut().isBlank()
                ? StatutSeance.valueOf(req.statut()) : StatutSeance.BROUILLON);

        if (req.eleveIds() != null) {
            s.getEleves().clear();
            s.getEleves().addAll(eleveRepo.findAllById(req.eleveIds()));
        }

        s.setProgramme(programme(req.programme()));

        s.getBlocs().clear();
        if (req.blocs() != null) {
            int order = 0;
            for (BlocRequest b : req.blocs()) {
                BlocContenu bloc = new BlocContenu();
                bloc.setSeance(s);
                bloc.setTypeBloc(TypeBloc.valueOf(b.typeBloc()));
                bloc.setContenu(b.contenu());
                bloc.setMediaUrl(b.mediaUrl());
                bloc.setOrdre(b.ordre() != null ? b.ordre() : order);
                s.getBlocs().add(bloc);
                order++;
            }
        }
    }

    private static boolean conduite(PartieCode p) {
        return p.chapitre() != null && p.chapitre().startsWith("conduite-");
    }

    /** Séance vue par un élève en perfectionnement : seulement les parties de conduite, sans le
        contenu libre (théorie du code). Les autres élèves la voient en entier. */
    private SeanceResponse pourEleve(Seance s, Eleve eleve) {
        SeanceResponse r = toResponse(s);
        if (!eleve.estPerfectionnement()) return r;
        return new SeanceResponse(r.id(), r.titre(), r.dateHeure(), r.theme(), r.statut(), r.moniteurId(), r.moniteurNom(),
                List.of(), List.of(), r.programme().stream().filter(SeanceService::conduite).toList(), r.createdAt());
    }

    /** Programme vérifié : chapitres connus du code ou du parcours de conduite (pas les séries d'examen),
        bornes de panneaux cohérentes, sans doublon. */
    private static List<PartieCode> programme(List<PartieCode> parties) {
        List<PartieCode> propre = new ArrayList<>();
        if (parties == null) return propre;
        if (parties.size() > 30) throw new BusinessException("30 parties de cours au plus par séance");
        for (PartieCode p : parties) {
            String ch = p.chapitre();
            if (ch == null || !ProgressionCodeController.CHAPITRES.contains(ch) || ch.startsWith("serie-"))
                throw new BusinessException("Chapitre de code inconnu : " + ch);
            Integer de = p.de(), a = p.a();
            if ((de == null) != (a == null) || (de != null && (de < 1 || a < de || a > 100)))
                throw new BusinessException("Numéros de panneaux invalides pour le chapitre « " + ch + " »");
            PartieCode x = new PartieCode(ch, de, a);
            if (!propre.contains(x)) propre.add(x);
        }
        return propre;
    }

    private SeanceResponse toResponse(Seance s) {
        List<SeanceResponse.EleveInfo> elevesInfo = s.getEleves().stream()
                .map(e -> new SeanceResponse.EleveInfo(e.getId(), e.getPrenom() + " " + e.getNom(), e.getEmail()))
                .toList();
        List<SeanceResponse.BlocInfo> blocsInfo = s.getBlocs().stream()
                .map(b -> new SeanceResponse.BlocInfo(b.getId(), b.getTypeBloc().name(),
                        b.getContenu(), b.getMediaUrl(), b.getOrdre()))
                .toList();
        return new SeanceResponse(
                s.getId(), s.getTitre(), s.getDateHeure(),
                s.getTheme() != null ? s.getTheme().name() : null,
                s.getStatut().name(),
                s.getMoniteur().getId(), s.getMoniteur().getNom(),
                elevesInfo, blocsInfo, s.getProgramme(), s.getCreatedAt()
        );
    }
}
